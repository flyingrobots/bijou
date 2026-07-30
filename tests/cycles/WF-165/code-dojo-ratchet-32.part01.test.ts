import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import {
  parseFileContextBaseline,
  validateLiveFileContextBaseline,
} from './file-context-baseline-contract.js';
import {
  debtScript,
  expectFamilyFilesWithinBounds,
  read,
  ROOT,
} from './ratchet-contract-support.js';
import { TRANCHE_C_ROOTS } from './tranche-c-contract.js';
import { TRANCHE_C_FAMILY_MEMBERS } from './tranche-c-families.js';

describe('WF-165 Code Dojo tranche C debt contract', () => {
  it('removes five double-counted roots and lowers debt to 32', () => {
    const baseline = parseFileContextBaseline(
      read('scripts/code-dojo/baselines/file-context.json'),
    );
    validateLiveFileContextBaseline(
      baseline,
      (path) => existsSync(resolve(ROOT, path)) ? read(path) : undefined,
    );
    const contextPaths = baseline.files.map((entry) => entry.path);
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);

    expect(TRANCHE_C_ROOTS).toHaveLength(5);
    expect(contextPaths).toHaveLength(22);
    expect(codeSizePaths).toHaveLength(10);
    expect(debtScript()).toBe('tsx scripts/code-dojo-debt.ts --max 32');
    for (const root of TRANCHE_C_ROOTS) {
      expect(contextPaths, root).not.toContain(root);
      expect(codeSizePaths, root).not.toContain(root);
    }
  });

  it('keeps every tranche-C family file within the strict context gate', () => {
    expectFamilyFilesWithinBounds(
      TRANCHE_C_ROOTS,
      TRANCHE_C_FAMILY_MEMBERS,
    );
  });
});
