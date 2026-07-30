import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from '../DX-050/runtime-import-cycles.js';
import { splitModuleFamily } from '../DX-050/split-module-family.js';
import { publicExportNames } from './public-export-contract.js';
import {
  TRANCHE_A_PUBLIC_EXPORTS,
  TRANCHE_A_ROOTS,
} from './tranche-a-contract.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('WF-165 Code Dojo tranche A architecture', () => {
  it('preserves every selected public export name', () => {
    expect(Object.keys(TRANCHE_A_PUBLIC_EXPORTS).sort()).toEqual(
      [...TRANCHE_A_ROOTS].sort(),
    );
    for (const root of TRANCHE_A_ROOTS) {
      expect(publicExportNames(ROOT, root), root).toEqual(
        [...TRANCHE_A_PUBLIC_EXPORTS[root]].sort(),
      );
    }
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_A_ROOTS.flatMap((entrypoint) => {
      const files = splitModuleFamily(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      return files;
    });
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });
});
