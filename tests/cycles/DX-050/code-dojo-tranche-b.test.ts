import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import { splitModuleFamily } from './split-module-family.js';
import {
  TRANCHE_B_CLEARED_PATHS,
  TRANCHE_B_CODE_SIZE_PATHS,
} from './tranche-b-paths.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const MAX_LINES = 150;
const MAX_BYTES = 12_000;

interface FileContextBaseline {
  readonly files: readonly Readonly<{ path: string }>[];
}

function readFileContextBaseline(): FileContextBaseline {
  const parsed: unknown = JSON.parse(
    readFileSync(
      resolve(ROOT, 'scripts/code-dojo/baselines/file-context.json'),
      'utf8',
    ),
  );
  if (
    parsed == null
    || typeof parsed !== 'object'
    || !('files' in parsed)
    || !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  return {
    files: parsed.files.map((entry: unknown) => {
      if (
        entry == null
        || typeof entry !== 'object'
        || !('path' in entry)
        || typeof entry.path !== 'string'
      ) {
        throw new Error('invalid file/context baseline entry');
      }
      return { path: entry.path };
    }),
  };
}

describe('DX-050 Code Dojo tranche B', () => {
  it('removes 25 counted violations and lowers the ceiling to 62', () => {
    const fileContextPaths = readFileContextBaseline().files.map(
      (entry) => entry.path,
    );
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);
    const packageJson: unknown = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    );
    if (
      packageJson == null
      || typeof packageJson !== 'object'
      || !('scripts' in packageJson)
      || packageJson.scripts == null
      || typeof packageJson.scripts !== 'object'
    ) {
      throw new Error('package.json scripts must be an object');
    }

    expect(TRANCHE_B_CLEARED_PATHS).toHaveLength(24);
    expect(TRANCHE_B_CODE_SIZE_PATHS).toHaveLength(1);
    expect(fileContextPaths).toHaveLength(37);
    expect(CODE_SIZE_BASELINE).toHaveLength(25);
    expect(packageJson.scripts).toHaveProperty(
      'code-dojo:debt',
      'tsx scripts/code-dojo-debt.ts --max 62',
    );
    for (const path of TRANCHE_B_CLEARED_PATHS) {
      expect(fileContextPaths, path).not.toContain(path);
    }
    for (const path of TRANCHE_B_CODE_SIZE_PATHS) {
      expect(codeSizePaths, path).not.toContain(path);
    }
  });

  it('keeps every extracted production module within the context gate', () => {
    for (const entrypoint of TRANCHE_B_CLEARED_PATHS) {
      const files = splitModuleFamily(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        const lines = source.split(/\r?\n/u).length;
        const bytes = Buffer.byteLength(source, 'utf8');
        expect(
          lines <= MAX_LINES && bytes <= MAX_BYTES,
          `${file} is ${String(lines)} lines / ${String(bytes)} bytes`,
        ).toBe(true);
      }
    }
  });
});
