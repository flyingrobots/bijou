import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = readFileSync(resolve(ROOT, 'README.md'), 'utf8');

describe('README dependency note', () => {
  it('anchors the xlsx security note with a date and official install guidance', () => {
    expect(README).toMatch(/Dependency note:\nAs of \d{4}-\d{2}-\d{2}, `xlsx` is installed from the official SheetJS CDN tarball/);
    expect(README).toContain('https://docs.sheetjs.com/docs/getting-started/installation/nodejs/');
  });
});
