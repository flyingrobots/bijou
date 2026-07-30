import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import { loadCodeDojoDebtSummary } from '../../../scripts/code-dojo-debt.js';
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
import { TRANCHE_E_ROOTS } from './tranche-e-contract.js';
import { TRANCHE_E_FAMILY_MEMBERS } from './tranche-e-families.js';

describe('WF-165 Code Dojo tranche E debt contract', () => {
  it('removes the final five double-counted roots and lowers debt to 12', () => {
    const baseline = parseFileContextBaseline(
      read('scripts/code-dojo/baselines/file-context.json'),
    );
    validateLiveFileContextBaseline(
      baseline,
      (path) => existsSync(resolve(ROOT, path)) ? read(path) : undefined,
    );
    const contextPaths = baseline.files.map((entry) => entry.path);
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);
    const measuredDebt = loadCodeDojoDebtSummary(ROOT);

    expect(TRANCHE_E_ROOTS).toHaveLength(5);
    expect(contextPaths).toHaveLength(12);
    expect(codeSizePaths).toHaveLength(0);
    expect(measuredDebt).toMatchObject({
      fileContextViolations: 12,
      mockBanViolations: 0,
      codeSizeViolations: 0,
      eslintViolations: 0,
      totalViolations: 12,
    });
    expect(debtScript()).toBe('tsx scripts/code-dojo-debt.ts --max 12');
    for (const root of TRANCHE_E_ROOTS) {
      expect(contextPaths, root).not.toContain(root);
      expect(codeSizePaths, root).not.toContain(root);
    }
  });

  it('keeps every tranche-E family file within the strict context gate', () => {
    expectFamilyFilesWithinBounds(
      TRANCHE_E_ROOTS,
      TRANCHE_E_FAMILY_MEMBERS,
    );
  });
});
