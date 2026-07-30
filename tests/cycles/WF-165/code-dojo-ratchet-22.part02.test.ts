import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from '../DX-050/runtime-import-cycles.js';
import { publicExportNames } from './public-export-contract.js';
import {
  TRANCHE_D_PUBLIC_EXPORTS,
  TRANCHE_D_ROOTS,
} from './tranche-d-contract.js';
import { TRANCHE_D_FAMILY_MEMBERS } from './tranche-d-families.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('WF-165 Code Dojo tranche D architecture', () => {
  it('preserves every selected public export name', () => {
    expect(Object.keys(TRANCHE_D_PUBLIC_EXPORTS).sort()).toEqual(
      [...TRANCHE_D_ROOTS].sort(),
    );
    for (const root of TRANCHE_D_ROOTS) {
      expect(publicExportNames(ROOT, root), root).toEqual(
        [...TRANCHE_D_PUBLIC_EXPORTS[root]].sort(),
      );
    }
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_D_ROOTS.flatMap((entrypoint) =>
      TRANCHE_D_FAMILY_MEMBERS[entrypoint].map((path) => resolve(ROOT, path)),
    );
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });
});
