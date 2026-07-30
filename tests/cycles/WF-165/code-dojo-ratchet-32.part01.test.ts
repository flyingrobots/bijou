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
import { TRANCHE_C_ROOTS } from './tranche-c-contract.js';
import { TRANCHE_C_FAMILY_MEMBERS } from './tranche-c-families.js';

describe('WF-165 Code Dojo tranche C debt contract', () => {
  it('keeps tranche-C debt absent as later tranches lower the ceiling', () => {
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

    expect(TRANCHE_C_ROOTS).toHaveLength(5);
    expect(contextPaths.length).toBeLessThanOrEqual(22);
    expect(codeSizePaths.length).toBeLessThanOrEqual(10);
    expect(measuredDebt.fileContextViolations).toBeLessThanOrEqual(22);
    expect(measuredDebt.codeSizeViolations).toBeLessThanOrEqual(10);
    expect(measuredDebt.totalViolations).toBeLessThanOrEqual(32);
    const command = debtScript();
    expect(command).toMatch(/^tsx scripts\/code-dojo-debt\.ts --max \d+$/u);
    const ceiling = Number(
      command?.match(/--max (?<ceiling>\d+)$/u)?.groups?.ceiling,
    );
    expect(Number.isSafeInteger(ceiling)).toBe(true);
    expect(ceiling).toBeLessThanOrEqual(32);
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
