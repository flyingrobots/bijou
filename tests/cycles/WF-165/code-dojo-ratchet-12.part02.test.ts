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
import { TRANCHE_E_ROOTS } from './tranche-e-contract.js';
import { TRANCHE_E_FAMILY_MEMBERS } from './tranche-e-families.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('WF-165 Code Dojo tranche E architecture', () => {
  it('preserves the public component-story collection type', () => {
    expectTypeOf(COMPONENT_STORIES).toEqualTypeOf<
      readonly DogfoodComponentStory[]
    >();
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_E_ROOTS.flatMap((entrypoint) =>
      TRANCHE_E_FAMILY_MEMBERS[entrypoint].map((path) => resolve(ROOT, path)),
    );
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });
});
