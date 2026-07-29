import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from './runtime-import-cycles.js';
import { splitModuleFamily } from './split-module-family.js';
import { TRANCHE_B_CLEARED_PATHS } from './tranche-b-paths.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('DX-050 tranche B split-module architecture', () => {
  it('keeps every extracted family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_B_CLEARED_PATHS.flatMap((entrypoint) => {
      const files = splitModuleFamily(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      return files;
    });

    expect(
      findRuntimeCyclesTouching(projectFiles, trancheFiles),
    ).toEqual([]);
  });
});
