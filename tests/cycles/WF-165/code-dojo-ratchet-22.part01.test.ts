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
import { TRANCHE_D_ROOTS } from './tranche-d-contract.js';
import { TRANCHE_D_FAMILY_MEMBERS } from './tranche-d-families.js';

describe('WF-165 Code Dojo tranche D debt contract', () => {
  it('keeps tranche-D debt absent as later tranches lower the ceiling', () => {
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

    expect(TRANCHE_D_ROOTS).toHaveLength(5);
    expect(contextPaths.length).toBeLessThanOrEqual(17);
    expect(codeSizePaths.length).toBeLessThanOrEqual(5);
    expect(measuredDebt.fileContextViolations).toBeLessThanOrEqual(17);
    expect(measuredDebt.codeSizeViolations).toBeLessThanOrEqual(5);
    expect(measuredDebt.totalViolations).toBeLessThanOrEqual(22);
    const command = debtScript();
    expect(command).toMatch(/^tsx scripts\/code-dojo-debt\.ts --max \d+$/u);
    const ceiling = Number(
      command?.match(/--max (?<ceiling>\d+)$/u)?.groups?.ceiling,
    );
    expect(Number.isSafeInteger(ceiling)).toBe(true);
    expect(ceiling).toBeLessThanOrEqual(22);
    for (const root of TRANCHE_D_ROOTS) {
      expect(contextPaths, root).not.toContain(root);
      expect(codeSizePaths, root).not.toContain(root);
    }
  });

  it('keeps every tranche-D family file within the strict context gate', () => {
    expectFamilyFilesWithinBounds(
      TRANCHE_D_ROOTS,
      TRANCHE_D_FAMILY_MEMBERS,
    );
  });
});
