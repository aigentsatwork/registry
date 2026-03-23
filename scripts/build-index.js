#!/usr/bin/env node

/**
 * Build Registry Index
 * Reads all approved YAML files in apps/ and outputs a single registry.json
 * This file is consumed by the pwa.mobi directory website
 * Run: npm run build-index
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const APPS_DIR = path.join(__dirname, '../apps');
const OUTPUT_FILE = path.join(__dirname, '../registry.json');

function buildIndex() {
  const files = fs.readdirSync(APPS_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

  const apps = [];
  const errors = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(APPS_DIR, file), 'utf8');
      const data = yaml.load(content);

      // Build clean public record (strip private fields like email)
      apps.push({
        id: path.basename(file, '.yaml'),
        name: data.name,
        tagline: data.tagline,
        category: data.category,
        url: data.url,
        developer: {
          name: data.developer.name,
          github: data.developer.github,
          website: data.developer?.website || null
        },
        listing: {
          description: data.listing.description.trim(),
          icon_url: data.listing.icon_url,
          screenshots: data.listing?.screenshots || [],
          tags: data.listing?.tags || []
        },
        payment_model: data.payment_model,
        pricing_url: data.pricing_url || null,
        open_source_url: data.open_source_url || null,
        submission_date: data.submission_date,
        trust: {
          verified: true,
          badge: data.open_source_url ? 'open-source' : 'verified'
        }
      });
    } catch (e) {
      errors.push({ file, error: e.message });
    }
  }

  if (errors.length > 0) {
    console.error('Errors parsing YAML files:');
    errors.forEach(e => console.error(`  ${e.file}: ${e.error}`));
  }

  // Sort by submission date, newest first
  apps.sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date));

  const index = {
    generated_at: new Date().toISOString(),
    total: apps.length,
    apps
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Built registry.json — ${apps.length} apps indexed`);

  if (errors.length > 0) {
    console.error(`${errors.length} file(s) had errors and were skipped`);
    process.exit(1);
  }
}

buildIndex();
