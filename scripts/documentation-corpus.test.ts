import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { documentationFileExists, readDocumentationFile } from './documentation-corpus.js';

const ROOT = resolve(import.meta.dirname, '..');

describe('compiled book document access', () => {
  it('preserves exact retired source bytes for DOGFOOD and contract checks', () => {
    const path = resolve(ROOT, 'docs/design/README.md');
    expect(existsSync(path)).toBe(false);
    const text = readDocumentationFile(path, 'utf8');
    expect(createHash('sha256').update(text).digest('hex')).toBe('290c5925eb6bed530b7581bb390b3acbb53163b65e4a0d5896cf603c0cf939dd');
    expect(documentationFileExists(path)).toBe(true);
  });

  it('prefers a live document over its archived edition', () => {
    const directory = mkdtempSync(join(tmpdir(), 'bijou-book-'));
    try {
      const path = join(directory, 'README.md');
      writeFileSync(path, 'Current text');
      expect(readDocumentationFile(path, 'utf8')).toBe('Current text');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects unknown documents and paths outside the repository', () => {
    for (const path of [resolve(ROOT, 'docs/missing.md'), '/elsewhere/docs/design/README.md']) {
      expect(documentationFileExists(path)).toBe(false);
      expect(() => readDocumentationFile(path, 'utf8')).toThrow();
    }
  });
});
