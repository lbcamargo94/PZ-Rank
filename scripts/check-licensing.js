#!/usr/bin/env node
/**
 * PZ Community — Licensing structure audit script
 *
 * Checks that the required licensing files are present and consistent.
 * Does NOT block the build. Reports warnings and errors to stdout.
 *
 * Usage:  node scripts/check-licensing.js [--strict]
 *   --strict  exits with code 1 if any ERROR is found (for CI use)
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const strict = process.argv.includes('--strict');

let errors   = 0;
let warnings = 0;

function ok(msg)   { console.log(`  ✓  ${msg}`); }
function warn(msg) { console.warn(`  ⚠  ${msg}`); warnings++; }
function fail(msg) { console.error(`  ✗  ${msg}`); errors++; }

function check(label, filePath, required = true) {
  const full = join(ROOT, filePath);
  if (existsSync(full)) {
    ok(`${label} found (${filePath})`);
    return true;
  }
  if (required) fail(`${label} MISSING — expected at ${filePath}`);
  else          warn(`${label} not found (${filePath}) — optional`);
  return false;
}

function containsText(filePath, text, label) {
  const full = join(ROOT, filePath);
  if (!existsSync(full)) return;
  // Normalize whitespace (including newlines + indentation) before searching
  const content = readFileSync(full, 'utf8').replace(/\s+/g, ' ');
  const needle  = text.replace(/\s+/g, ' ');
  if (content.includes(needle)) ok(`${label}`);
  else                           warn(`${label} — text not found in ${filePath}`);
}

function checkYear(filePath) {
  const full = join(ROOT, filePath);
  if (!existsSync(full)) return;
  const content = readFileSync(full, 'utf8');
  const year = new Date().getFullYear().toString();
  if (content.includes(year)) ok(`Year ${year} present in ${filePath}`);
  else                         warn(`Year ${year} NOT found in ${filePath} — may be outdated`);
}

function checkNoSecrets(filePath) {
  const full = join(ROOT, filePath);
  if (!existsSync(full)) return;
  const content = readFileSync(full, 'utf8');
  const patterns = [
    /supabase_key\s*=\s*['"][^'"]{20,}/i,
    /jwt_secret\s*=\s*['"][^'"]{8,}/i,
    /password\s*=\s*['"][^'"]{4,}/i,
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,  // JWT token pattern
  ];
  for (const p of patterns) {
    if (p.test(content)) {
      fail(`Possible secret detected in ${filePath} — review before committing!`);
      return;
    }
  }
  ok(`No obvious secrets in ${filePath}`);
}

// ─────────────────────────────────────────────────────────────────
console.log('\n=== PZ Community — Licensing Audit ===\n');

// 1. Required files
console.log('── Required license files ──');
check('LICENSE',               'LICENSE');
check('THIRD_PARTY_LICENSES',  'THIRD_PARTY_LICENSES.md');
check('COMPETITION_TERMS',     'COMPETITION_TERMS.md');
check('TERMS_OF_USE',          'TERMS_OF_USE.md');
check('PRIVACY',               'PRIVACY.md');
check('docs/LICENSING',        'docs/LICENSING.md');
check('docs/IP_PROTECTION',    'docs/IP_PROTECTION.md');

// 2. LICENSE content checks
console.log('\n── LICENSE content ──');
containsText('LICENSE', 'Lucas Buneo de Camargo',   'Copyright holder present');
containsText('LICENSE', 'PZ Community Proprietary', 'License name present');
containsText('LICENSE', 'does not constitute a grant of rights', 'Public ≠ open-source clause present');
containsText('LICENSE', 'cannot be excluded under applicable law', 'Reserved legal rights clause present');
checkYear('LICENSE');

// 3. README check
console.log('\n── README ──');
const hasReadme = check('README', 'README.md');
if (hasReadme) containsText('README.md', 'License', 'License section in README');

// 4. Sensitive file checks
console.log('\n── Sensitive files (should not be committed) ──');
const sensitiveFiles = ['.env', '.env.local', 'backend/.env', 'backend/.env.local'];
for (const f of sensitiveFiles) {
  const full = join(ROOT, f);
  if (existsSync(full)) warn(`${f} exists locally — ensure it is in .gitignore`);
  else                  ok(`${f} not present in working tree`);
}

// 5. .gitignore check
console.log('\n── .gitignore ──');
const hasGitignore = check('.gitignore', '.gitignore');
if (hasGitignore) {
  containsText('.gitignore', '.env', '.env covered by .gitignore');
  containsText('.gitignore', 'node_modules', 'node_modules covered by .gitignore');
}

// 6. package.json license fields
console.log('\n── package.json license fields ──');
const pkgs = [
  { label: 'backend/package.json',  path: 'backend/package.json' },
  { label: 'frontend/package.json', path: 'frontend/package.json' },
];
for (const pkg of pkgs) {
  const full = join(ROOT, pkg.path);
  if (!existsSync(full)) { warn(`${pkg.label} not found`); continue; }
  const json = JSON.parse(readFileSync(full, 'utf8'));
  if (json.license) ok(`${pkg.label} has license field: "${json.license}"`);
  else              warn(`${pkg.label} missing "license" field`);
}

// 7. TODO markers check
console.log('\n── TODO markers requiring manual review ──');
const docsToScan = [
  'LICENSE', 'THIRD_PARTY_LICENSES.md', 'COMPETITION_TERMS.md',
  'TERMS_OF_USE.md', 'PRIVACY.md', 'docs/LICENSING.md', 'docs/IP_PROTECTION.md',
];
let totalTodos = 0;
for (const f of docsToScan) {
  const full = join(ROOT, f);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, 'utf8');
  const matches = content.match(/TODO:/g);
  if (matches) {
    console.warn(`  ⚠  ${f}: ${matches.length} TODO item(s) pending review`);
    totalTodos += matches.length;
    warnings++;
  }
}
if (totalTodos === 0) ok('No TODO items in licensing documents');

// ─────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0 || warnings > 0) {
  console.log('\n  Review the items above before publishing or releasing.\n');
} else {
  console.log('\n  All checks passed.\n');
}

if (strict && errors > 0) process.exit(1);
