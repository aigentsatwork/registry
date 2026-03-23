#!/usr/bin/env node

/**
 * Local validation script
 * Usage: npm run validate apps/your-app.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npm run validate apps/your-app.yaml');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`\nValidating: ${filePath}\n`);

// Parse YAML
let data;
try {
  const content = fs.readFileSync(filePath, 'utf8');
  data = yaml.load(content);
  console.log('✅ YAML syntax is valid');
} catch (e) {
  console.error(`❌ YAML parse error: ${e.message}`);
  process.exit(1);
}

// Schema validation
const schemaPath = path.join(__dirname, '../schema/app.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const valid = ajv.validate(schema, data);

if (!valid) {
  console.error('❌ Schema validation failed:');
  ajv.errors.forEach(e => console.error(`   • ${e.instancePath || '(root)'} ${e.message}`));
  process.exit(1);
} else {
  console.log('✅ Schema validation passed');
}

// Basic checks
const checks = [];

if (!data.url?.startsWith('https://')) {
  checks.push('❌ URL must start with https://');
} else {
  checks.push('✅ URL uses HTTPS');
}

if (!data.manifest_url?.startsWith('https://')) {
  checks.push('❌ manifest_url must start with https://');
} else {
  checks.push('✅ manifest_url uses HTTPS');
}

if (!data.listing?.icon_url?.startsWith('https://')) {
  checks.push('❌ icon_url must start with https://');
} else {
  checks.push('✅ icon_url uses HTTPS');
}

if (data.listing?.description?.length < 50) {
  checks.push(`❌ Description too short (${data.listing?.description?.length} chars, minimum 50)`);
} else if (data.listing?.description?.length > 500) {
  checks.push(`❌ Description too long (${data.listing?.description?.length} chars, maximum 500)`);
} else {
  checks.push(`✅ Description length OK (${data.listing?.description?.length} chars)`);
}

if (data.tagline?.length > 80) {
  checks.push(`❌ Tagline too long (${data.tagline?.length} chars, maximum 80)`);
} else {
  checks.push(`✅ Tagline length OK`);
}

checks.forEach(c => console.log(c));

const failures = checks.filter(c => c.startsWith('❌'));
if (failures.length > 0) {
  console.error(`\n${failures.length} issue(s) found. Fix them before submitting.\n`);
  process.exit(1);
}

console.log('\n✅ All local checks passed!');
console.log('Next: open a Pull Request to submit for full automated audit.\n');
console.log('Remember to also check your Lighthouse PWA score at https://web.dev/measure');
