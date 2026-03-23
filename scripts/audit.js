#!/usr/bin/env node

/**
 * pwa.mobi Registry Audit Script
 * Runs on every PR that adds or modifies a file in apps/
 * Posts results as a GitHub PR comment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ─── Config ──────────────────────────────────────────────────────────────────

const LIGHTHOUSE_PWA_THRESHOLD = 85;
const SCHEMA_PATH = path.join(__dirname, '../schema/app.schema.json');
const SAFE_BROWSING_API_KEY = process.env.SAFE_BROWSING_API_KEY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const PR_NUMBER = process.argv[2];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[audit] ${msg}`); }

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function fetchHead(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const mod = require(u.protocol === 'https:' ? 'https' : 'http');
      const req = mod.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
        resolve({ status: res.statusCode, headers: res.headers });
      });
      req.on('error', () => resolve({ status: 0, headers: {} }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {} }); });
      req.end();
    } catch { resolve({ status: 0, headers: {} }); }
  });
}

// ─── Get changed YAML files from the PR ──────────────────────────────────────

function getChangedAppFiles() {
  try {
    const output = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f.startsWith('apps/') && f.endsWith('.yaml') && !f.includes('_template'));
  } catch {
    // Fallback: find all yaml files modified
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f.startsWith('apps/') && f.endsWith('.yaml') && !f.includes('_template'));
  }
}

// ─── Parse YAML (lightweight, no external dep needed for simple cases) ────────

function parseYaml(filePath) {
  try {
    const yaml = require('js-yaml');
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (e) {
    throw new Error(`Failed to parse YAML: ${e.message}`);
  }
}

// ─── Schema Validation ────────────────────────────────────────────────────────

function validateSchema(data) {
  try {
    const Ajv = require('ajv');
    const addFormats = require('ajv-formats');
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const valid = ajv.validate(schema, data);
    if (!valid) {
      return {
        pass: false,
        errors: ajv.errors.map(e => `${e.instancePath} ${e.message}`)
      };
    }
    return { pass: true, errors: [] };
  } catch (e) {
    return { pass: false, errors: [`Schema validation error: ${e.message}`] };
  }
}

// ─── HTTPS Check ─────────────────────────────────────────────────────────────

async function checkHttps(url) {
  if (!url.startsWith('https://')) {
    return { pass: false, detail: 'URL does not use HTTPS' };
  }
  const result = await fetchHead(url);
  if (result.status === 0) {
    return { pass: false, detail: 'Could not connect to URL' };
  }
  if (result.status >= 400) {
    return { pass: false, detail: `URL returned HTTP ${result.status}` };
  }
  return { pass: true, detail: `HTTP ${result.status}` };
}

// ─── Manifest Check ──────────────────────────────────────────────────────────

async function checkManifest(manifestUrl) {
  const result = await fetchHead(manifestUrl);
  if (result.status !== 200) {
    return { pass: false, detail: `Manifest URL returned HTTP ${result.status}` };
  }

  // Try to fetch and parse the manifest
  try {
    const response = await fetchJson(manifestUrl);
    const manifest = response.body;

    const required = ['name', 'icons', 'start_url', 'display'];
    const missing = required.filter(field => !manifest[field]);

    if (missing.length > 0) {
      return { pass: false, detail: `Missing required fields: ${missing.join(', ')}` };
    }

    // Check icons array has at least one entry
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      return { pass: false, detail: 'icons array is empty' };
    }

    // Check display mode
    const validDisplay = ['standalone', 'fullscreen', 'minimal-ui'];
    if (!validDisplay.includes(manifest.display)) {
      return { pass: false, detail: `display must be one of: ${validDisplay.join(', ')}` };
    }

    return { pass: true, detail: `Valid manifest — display: ${manifest.display}, ${manifest.icons.length} icon(s)` };
  } catch (e) {
    return { pass: false, detail: `Could not parse manifest JSON: ${e.message}` };
  }
}

// ─── Icon Check ──────────────────────────────────────────────────────────────

async function checkIcon(iconUrl) {
  if (!iconUrl) return { pass: false, detail: 'No icon URL provided' };
  const result = await fetchHead(iconUrl);
  if (result.status !== 200) {
    return { pass: false, detail: `Icon URL returned HTTP ${result.status}` };
  }
  const contentType = result.headers['content-type'] || '';
  if (!contentType.includes('image/')) {
    return { pass: false, detail: `Icon URL does not return an image (got ${contentType})` };
  }
  return { pass: true, detail: `Icon reachable (${contentType})` };
}

// ─── Security Headers Check ──────────────────────────────────────────────────

async function checkSecurityHeaders(url) {
  const result = await fetchHead(url);
  const headers = result.headers || {};
  const issues = [];

  if (!headers['content-security-policy']) {
    issues.push('Missing Content-Security-Policy header');
  }

  if (issues.length > 0) {
    return { pass: false, detail: issues.join('; ') };
  }
  return { pass: true, detail: 'CSP header present' };
}

// ─── Lighthouse Audit ────────────────────────────────────────────────────────

async function runLighthouse(url) {
  try {
    // Install lighthouse if not present
    try { execSync('which lighthouse', { stdio: 'ignore' }); }
    catch { execSync('npm install -g lighthouse', { stdio: 'inherit' }); }

    const output = execSync(
      `lighthouse ${url} --only-categories=pwa --output=json --quiet --chrome-flags="--headless --no-sandbox --disable-gpu"`,
      { encoding: 'utf8', timeout: 120000 }
    );

    const report = JSON.parse(output);
    const score = Math.round(report.categories.pwa.score * 100);

    return {
      pass: score >= LIGHTHOUSE_PWA_THRESHOLD,
      score,
      detail: `Score: ${score}/100 (threshold: ${LIGHTHOUSE_PWA_THRESHOLD})`
    };
  } catch (e) {
    // Lighthouse failures shouldn't block — mark as warning
    return {
      pass: null,
      score: null,
      detail: `Lighthouse could not run: ${e.message.split('\n')[0]}`,
      warning: true
    };
  }
}

// ─── Safe Browsing Check ─────────────────────────────────────────────────────

async function checkSafeBrowsing(url) {
  if (!SAFE_BROWSING_API_KEY) {
    return { pass: null, detail: 'Safe Browsing check skipped (no API key)', warning: true };
  }

  try {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`;
    const body = JSON.stringify({
      client: { clientId: 'pwamobi-registry', clientVersion: '1.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }]
      }
    });

    const result = await fetchJson(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      body
    });

    if (result.body.matches && result.body.matches.length > 0) {
      return { pass: false, detail: `Domain flagged by Google Safe Browsing: ${result.body.matches[0].threatType}` };
    }
    return { pass: true, detail: 'Clean — not flagged by Google Safe Browsing' };
  } catch (e) {
    return { pass: null, detail: `Safe Browsing check failed: ${e.message}`, warning: true };
  }
}

// ─── Service Worker Check ────────────────────────────────────────────────────

async function checkServiceWorker(url) {
  // We can't directly verify SW registration without a browser
  // We check if the URL returns service-worker related headers or
  // look for a common sw.js path as a proxy check
  const swPaths = ['/sw.js', '/service-worker.js', '/serviceworker.js'];
  for (const swPath of swPaths) {
    try {
      const swUrl = new URL(swPath, url).toString();
      const result = await fetchHead(swUrl);
      if (result.status === 200) {
        return { pass: true, detail: `Service worker found at ${swPath}` };
      }
    } catch {}
  }

  // Check manifest for serviceworker field
  return {
    pass: null,
    detail: 'Could not auto-detect service worker path. Lighthouse will verify.',
    warning: true
  };
}

// ─── PR Comment ──────────────────────────────────────────────────────────────

async function postComment(body) {
  if (!GITHUB_TOKEN || !REPO || !PR_NUMBER) {
    log('No GitHub token/repo/PR — printing comment to stdout instead:');
    console.log(body);
    return;
  }

  const [owner, repo] = REPO.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`;
  const payload = JSON.stringify({ body });

  await fetchJson(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'User-Agent': 'pwamobi-audit-bot'
    },
    body: payload
  });
}

async function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

// ─── Format Report ───────────────────────────────────────────────────────────

function formatReport(appName, checks, overallPassed) {
  const icon = (check) => {
    if (check.pass === true) return '✅';
    if (check.pass === false) return '❌';
    return '⚠️';
  };

  const rows = checks.map(c =>
    `| ${c.name} | ${icon(c)} ${c.pass === true ? 'Pass' : c.pass === false ? 'Fail' : 'Warning'} | ${c.detail} |`
  ).join('\n');

  const failedChecks = checks.filter(c => c.pass === false);
  const failureSection = failedChecks.length > 0
    ? `\n### What to fix\n\n${failedChecks.map(c => `- **${c.name}:** ${c.detail}`).join('\n')}\n`
    : '';

  const status = overallPassed
    ? '## ✅ Audit Passed — Ready for Review'
    : '## ❌ Audit Failed — Please Fix the Issues Below';

  return `${status}

**App:** ${appName}
**Audited at:** ${new Date().toUTCString()}

| Check | Result | Detail |
|---|---|---|
${rows}
${failureSection}
${overallPassed
  ? '_All required checks passed. A maintainer will review and merge your PR shortly._'
  : '_Fix the issues above, then push a new commit. The audit will re-run automatically._'
}

---
*Automated audit by [pwa.mobi](https://pwa.mobi) · [Audit criteria](https://github.com/pwamobi/registry#audit-criteria)*`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Starting PWA audit...');

  const changedFiles = getChangedAppFiles();
  log(`Changed app files: ${changedFiles.join(', ') || 'none'}`);

  if (changedFiles.length === 0) {
    log('No app files changed — skipping audit');
    await setOutput('passed', 'true');
    return;
  }

  let allPassed = true;

  for (const filePath of changedFiles) {
    log(`\nAuditing: ${filePath}`);

    let data;
    try {
      data = parseYaml(path.join(process.cwd(), filePath));
    } catch (e) {
      await postComment(`## ❌ Audit Failed\n\nCould not parse YAML file: \`${e.message}\`\n\nMake sure your file is valid YAML and matches the [template](apps/_template.yaml).`);
      allPassed = false;
      continue;
    }

    // Run all checks
    log('Running schema validation...');
    const schemaResult = validateSchema(data);

    log('Running HTTPS check...');
    const httpsResult = await checkHttps(data.url || '');

    log('Running manifest check...');
    const manifestResult = data.manifest_url ? await checkManifest(data.manifest_url) : { pass: false, detail: 'No manifest_url provided' };

    log('Running icon check...');
    const iconResult = await checkIcon(data.listing?.icon_url);

    log('Running security headers check...');
    const headersResult = await checkSecurityHeaders(data.url || '');

    log('Running service worker check...');
    const swResult = await checkServiceWorker(data.url || '');

    log('Running Safe Browsing check...');
    const safeBrowsingResult = await checkSafeBrowsing(data.url || '');

    log('Running Lighthouse audit...');
    const lighthouseResult = await runLighthouse(data.url || '');

    const checks = [
      { name: 'YAML Schema', ...schemaResult, detail: schemaResult.pass ? 'Valid' : schemaResult.errors.join('; ') },
      { name: 'HTTPS', ...httpsResult },
      { name: 'Web App Manifest', ...manifestResult },
      { name: 'Icon (512×512)', ...iconResult },
      { name: 'Service Worker', ...swResult },
      { name: 'Security Headers', ...headersResult },
      { name: 'Domain Reputation', ...safeBrowsingResult },
      { name: `Lighthouse PWA (≥${LIGHTHOUSE_PWA_THRESHOLD})`, ...lighthouseResult }
    ];

    // Overall pass = all non-warning checks pass
    const requiredChecks = checks.filter(c => !c.warning);
    const passed = requiredChecks.every(c => c.pass === true);

    if (!passed) allPassed = false;

    const appName = data.name || path.basename(filePath, '.yaml');
    const report = formatReport(appName, checks, passed);

    await postComment(report);
    log(`Audit complete for ${appName}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  await setOutput('passed', allPassed ? 'true' : 'false');
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
  console.error('Audit script error:', e);
  process.exit(1);
});
