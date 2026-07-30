import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from '../DX-050/runtime-import-cycles.js';
import { publicExportNames } from './public-export-contract.js';
import {
  TRANCHE_C_PUBLIC_EXPORTS,
  TRANCHE_C_ROOTS,
} from './tranche-c-contract.js';
import { TRANCHE_C_FAMILY_MEMBERS } from './tranche-c-families.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('WF-165 Code Dojo tranche C architecture', () => {
  it('preserves every selected public export name', () => {
    expect(Object.keys(TRANCHE_C_PUBLIC_EXPORTS).sort()).toEqual(
      [...TRANCHE_C_ROOTS].sort(),
    );
    for (const root of TRANCHE_C_ROOTS) {
      expect(publicExportNames(ROOT, root), root).toEqual(
        [...TRANCHE_C_PUBLIC_EXPORTS[root]].sort(),
      );
    }
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_C_ROOTS.flatMap((entrypoint) =>
      TRANCHE_C_FAMILY_MEMBERS[entrypoint].map((path) => resolve(ROOT, path)),
    );
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });
});
