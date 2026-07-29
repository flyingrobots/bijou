import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { replaceGeneratedDirectory } from '../../../scripts/replace-generated-directory.js';

describe('DX-050 generated artifact replacement', () => {
  it('preserves authoritative output when its first rename fails', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'bijou-generated-'));
    const output = resolve(root, 'generated');
    const stage = resolve(root, 'stage');
    const sentinel = resolve(output, 'authority.txt');
    mkdirSync(output);
    mkdirSync(stage);
    writeFileSync(sentinel, 'authority', 'utf8');
    try {
      expect(() => {
        replaceGeneratedDirectory(
          stage,
          output,
          resolve(output, 'nested-backup'),
        );
      }).toThrow();
      expect(existsSync(output)).toBe(true);
      expect(readFileSync(sentinel, 'utf8')).toBe('authority');
      expect(existsSync(stage)).toBe(false);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
