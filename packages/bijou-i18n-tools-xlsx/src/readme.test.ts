import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = readFileSync(resolve(ROOT, 'README.md'), 'utf8');
const SECURITY_NOTE_PATTERN = /Dependency note:\r?\nAs of \d{4}-\d{2}-\d{2}, `xlsx` is installed from the official SheetJS CDN tarball/;

describe('README dependency note', () => {
  it('anchors the xlsx security note with a date and official install guidance', () => {
    expect(README).toMatch(SECURITY_NOTE_PATTERN);
    expect(README).toContain('https://docs.sheetjs.com/docs/getting-started/installation/nodejs/');
  });

  it('accepts CRLF checkouts when validating the dependency note', () => {
    const crlfReadme = README.replace(/\n/g, '\r\n');
    expect(crlfReadme).toMatch(SECURITY_NOTE_PATTERN);
  });
});
