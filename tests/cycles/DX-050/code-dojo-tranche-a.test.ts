import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TRANCHE_A_CLEARED_PATHS } from './tranche-a-paths.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('DX-050 Code Dojo tranche A', () => {
  it('keeps 25 cleared production paths out of the live ledger', () => {
    const source = readFileSync(
      resolve(ROOT, 'scripts/code-dojo/baselines/file-context.json'),
      'utf8',
    );
    const baseline: unknown = JSON.parse(source);
    if (
      baseline == null
      || typeof baseline !== 'object'
      || !('files' in baseline)
      || !Array.isArray(baseline.files)
    ) {
      throw new Error('invalid file/context baseline');
    }
    const paths = baseline.files.map((entry: unknown) => {
      if (
        entry == null
        || typeof entry !== 'object'
        || !('path' in entry)
        || typeof entry.path !== 'string'
      ) {
        throw new Error('invalid file/context baseline entry');
      }
      return entry.path;
    });

    expect(TRANCHE_A_CLEARED_PATHS).toHaveLength(25);
    for (const path of TRANCHE_A_CLEARED_PATHS) {
      expect(paths, path).not.toContain(path);
    }
  });
});
