import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  COMPONENT_STORIES,
  type DogfoodComponentStory,
} from '../../../examples/docs/stories.js';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from '../DX-050/runtime-import-cycles.js';
import { readRepoFile } from '../repo.js';
import { publicExportNames } from './public-export-contract.js';
import {
  TRANCHE_E_PUBLIC_EXPORTS,
  TRANCHE_E_ROOTS,
} from './tranche-e-contract.js';
import { TRANCHE_E_FAMILY_MEMBERS } from './tranche-e-families.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('WF-165 Code Dojo tranche E architecture', () => {
  it('preserves every selected public export name', () => {
    expect(Object.keys(TRANCHE_E_PUBLIC_EXPORTS).sort()).toEqual(
      [...TRANCHE_E_ROOTS].sort(),
    );
    for (const root of TRANCHE_E_ROOTS) {
      expect(publicExportNames(ROOT, root), root).toEqual(
        [...TRANCHE_E_PUBLIC_EXPORTS[root]].sort(),
      );
    }
  });

  it('preserves the public component-story collection type', () => {
    expectTypeOf(COMPONENT_STORIES).toEqualTypeOf<
      readonly DogfoodComponentStory[]
    >();
  });

  it('preserves the public DOGFOOD function signatures', () => {
    const appRoot = readRepoFile('examples/docs/app-root.ts');
    const appRun = readRepoFile('examples/docs/app-run.ts');

    expect(appRoot).toContain('export function createDocsApp(\n  ctx:');
    expect(appRun).toContain('export async function runDocsApp(\n  ctx:');
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_E_ROOTS.flatMap((entrypoint) =>
      TRANCHE_E_FAMILY_MEMBERS[entrypoint].map((path) => resolve(ROOT, path)),
    );
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });
});
