import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import {
  parseFileContextBaseline,
  validateLiveFileContextBaseline,
} from './file-context-baseline-contract.js';
import { debtScript, read, ROOT } from './ratchet-contract-support.js';
import {
  TRANCHE_B_FAMILY_MEMBERS,
  TRANCHE_B_ROOTS,
} from './tranche-b-contract.js';

const MAX_LINES = 150;
const MAX_BYTES = 12_000;

describe('WF-165 Code Dojo tranche B debt contract', () => {
  it('keeps tranche-B debt absent as later tranches lower the ceiling', () => {
    const baseline = parseFileContextBaseline(
      read('scripts/code-dojo/baselines/file-context.json'),
    );
    validateLiveFileContextBaseline(baseline, (path) =>
      existsSync(resolve(ROOT, path)) ? read(path) : undefined,
    );
    const contextPaths = baseline.files.map((entry) => entry.path);
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);

    expect(TRANCHE_B_ROOTS).toHaveLength(5);
    expect(contextPaths.length).toBeLessThanOrEqual(27);
    expect(codeSizePaths.length).toBeLessThanOrEqual(15);
    const command = debtScript();
    expect(command).toMatch(/^tsx scripts\/code-dojo-debt\.ts --max \d+$/u);
    const ceiling = Number(
      command?.match(/--max (?<ceiling>\d+)$/u)?.groups?.ceiling,
    );
    expect(Number.isSafeInteger(ceiling)).toBe(true);
    expect(ceiling).toBeLessThanOrEqual(42);
    for (const root of TRANCHE_B_ROOTS) {
      expect(contextPaths, root).not.toContain(root);
      expect(codeSizePaths, root).not.toContain(root);
    }
  });

  it('keeps every tranche-B family file within the strict context gate', () => {
    for (const entrypoint of TRANCHE_B_ROOTS) {
      const family = TRANCHE_B_FAMILY_MEMBERS[entrypoint];
      expect(family.length, entrypoint).toBeGreaterThan(1);
      expect(family[0], entrypoint).toBe(entrypoint);
      for (const relativePath of family) {
        const file = resolve(ROOT, relativePath);
        expect(existsSync(file), relativePath).toBe(true);
        const source = readFileSync(file, 'utf8');
        const lines = source.split(/\r?\n/u).length;
        const bytes = Buffer.byteLength(source, 'utf8');
        expect(
          lines <= MAX_LINES && bytes <= MAX_BYTES,
          `${relativePath} is ${String(lines)} lines / ${String(bytes)} bytes`,
        ).toBe(true);
      }
    }
  });

  it('derives every skeleton main-pane identity through one helper', () => {
    expect(read('packages/bijou-tui-app/src/skeleton-layout.ts')).not.toContain(
      '`${spec.tab.id}-main`',
    );
  });

  it('keeps skeleton contract leaves pointed away from the aggregator', () => {
    for (const path of [
      'packages/bijou-tui-app/src/skeleton-page-contract.ts',
      'packages/bijou-tui-app/src/skeleton-state-contract.ts',
      'packages/bijou-tui-app/src/skeleton-tab-contract.ts',
      'packages/bijou-tui-app/src/skeleton-theme-contract.ts',
    ]) {
      expect(read(path), path).not.toContain("from './skeleton-contract.js'");
    }
    const aggregator = read('packages/bijou-tui-app/src/skeleton-contract.ts');
    expect(aggregator).not.toContain('import type');
    expect(aggregator).not.toContain('export interface');
  });
});
