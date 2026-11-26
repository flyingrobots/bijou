#!/usr/bin/env tsx
// Regenerate the East Asian wide table from the vendored UCD files.
// Usage: npm run unicode:wide-table [-- --check]
// Prints one JSON line. `--check` writes nothing and exits 1 on drift.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UCD_VERSION,
  WIDE_TABLE_OUTPUT,
  buildEastAsianWideTable,
} from './east-asian-wide-build.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = resolve(ROOT, WIDE_TABLE_OUTPUT);
const check = process.argv.includes('--check');

try {
  const source = buildEastAsianWideTable(ROOT);
  const current = existsSync(output) ? readFileSync(output, 'utf8') : '';
  const drift = current !== source;
  if (!check && drift) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, source, 'utf8');
  }
  const kind = check ? 'unicode.wide-table.check' : 'unicode.wide-table.generated';
  process.stdout.write(
    `${JSON.stringify({ kind, path: WIDE_TABLE_OUTPUT, unicodeVersion: UCD_VERSION, changed: drift })}\n`,
  );
  if (check && drift) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ kind: 'unicode.wide-table.error', message })}\n`);
  process.exitCode = 1;
}
