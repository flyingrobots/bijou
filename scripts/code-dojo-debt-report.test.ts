import { rmSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCodeDojoDebtSummary, summarizeCodeDojoDebt } from './code-dojo-debt.js';
import {
  buildCodeDojoDebtReport,
  loadCodeDojoDebtReport,
} from './code-dojo-debt-report.js';
import { parseCodeDojoLiveInput } from './code-dojo-debt-report-live.js';
import {
  FIXTURE_CEILING,
  FIXTURE_LIVE,
  createDebtFixtureRoot,
} from './code-dojo-debt-report-fixture.js';

const ROOT = new URL('..', import.meta.url).pathname;
const roots: string[] = [];

function fixtureRoot(): string {
  const root = createDebtFixtureRoot();
  roots.push(root);
  return root;
}

describe('Code Dojo debt report', () => {
  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('builds the golden non-empty report from a fixture with debt', () => {
    const report = loadCodeDojoDebtReport(fixtureRoot(), null);

    expect(report).toEqual({
      schema: 'code-dojo.debt-report.v1',
      totalViolations: 8,
      ceiling: FIXTURE_CEILING,
      goalpostReduction: 50,
      nextGoalpostTarget: 0,
      sources: [
        { id: 'file-context', count: 2 },
        { id: 'mock-ban', count: 1 },
        { id: 'code-size', count: 0, overHardLimit: 0 },
        { id: 'eslint', count: 5 },
      ],
      eslintRules: [
        { ruleId: 'no-a', count: 2 },
        { ruleId: 'no-b', count: 2 },
        { ruleId: 'no-c', count: 1 },
      ],
      live: null,
    });
  });

  it('matches the text gate totals on the fixture', () => {
    const root = fixtureRoot();
    const report = loadCodeDojoDebtReport(root, null);
    const summary = loadCodeDojoDebtSummary(root);

    expect(report.totalViolations).toBe(summary.totalViolations);
    expect(report.nextGoalpostTarget).toBe(summary.nextGoalpostTarget);
    expect(report.sources.map((source) => source.count)).toEqual([
      summary.fileContextViolations,
      summary.mockBanViolations,
      summary.codeSizeViolations,
      summary.eslintViolations,
    ]);
  });

  it('matches the text gate totals on the real tree and reads its ceiling', () => {
    const report = loadCodeDojoDebtReport(ROOT, null);
    const summary = loadCodeDojoDebtSummary(ROOT);

    expect(report.totalViolations).toBe(summary.totalViolations);
    expect(report.nextGoalpostTarget).toBe(summary.nextGoalpostTarget);
    expect(report.ceiling).toBe(0);
    expect(report.live).toBeNull();
  });

  it('counts code-size entries and hard-limit entries through the shared summary', () => {
    const debt = {
      fileContextEntries: [],
      mockBanViolations: [],
      codeSizeBaseline: [
        { path: 'src/a.ts', lines: 600 },
        { path: 'src/b.ts', lines: 1200 },
      ],
      eslintViolations: 60,
    };
    const report = buildCodeDojoDebtReport({ debt, ceiling: 70, eslintRules: [], live: null });

    expect(report.totalViolations).toBe(summarizeCodeDojoDebt(debt).totalViolations);
    expect(report.sources[2]).toEqual({ id: 'code-size', count: 2, overHardLimit: 1 });
    expect(report.nextGoalpostTarget).toBe(12);
  });

  it('caps rules at ten sorted by count then rule id', () => {
    const eslintRules = Array.from({ length: 12 }, (_, index) => ({
      ruleId: `rule-${String(index).padStart(2, '0')}`,
      count: index < 6 ? 3 : 1,
    }));
    const debt = { fileContextEntries: [], mockBanViolations: [], codeSizeBaseline: [], eslintViolations: 24 };
    const report = buildCodeDojoDebtReport({ debt, ceiling: 24, eslintRules: [...eslintRules].reverse(), live: null });

    expect(report.eslintRules).toHaveLength(10);
    expect(report.eslintRules.map((rule) => rule.ruleId).slice(0, 7)).toEqual(
      ['rule-00', 'rule-01', 'rule-02', 'rule-03', 'rule-04', 'rule-05', 'rule-06'],
    );
  });

  it('carries live data, sorts files, and keeps unavailable files distinct from measured empty', () => {
    const root = fixtureRoot();
    const live = parseCodeDojoLiveInput(FIXTURE_LIVE);
    const withFiles = loadCodeDojoDebtReport(root, live);
    const measuredEmpty = loadCodeDojoDebtReport(root, parseCodeDojoLiveInput({ ...FIXTURE_LIVE, eslintFiles: [] }));
    const unavailable = loadCodeDojoDebtReport(root, parseCodeDojoLiveInput({ ...FIXTURE_LIVE, eslintFiles: null }));

    expect(withFiles.live).toEqual({
      eslintViolations: 4,
      eslintFiles: [{ path: 'm.ts', count: 2 }, { path: 'a.ts', count: 1 }, { path: 'z.ts', count: 1 }],
    });
    expect(measuredEmpty.live?.eslintFiles).toEqual([]);
    expect(unavailable.live?.eslintFiles).toBeNull();
    expect(withFiles.totalViolations).toBe(8);
  });

  it('rejects malformed live input', () => {
    expect(() => parseCodeDojoLiveInput({ schema: 'wrong' })).toThrow('code-dojo.eslint-live.v1');
    expect(() => parseCodeDojoLiveInput({ ...FIXTURE_LIVE, eslintViolations: -1 })).toThrow('non-negative integer');
  });
});
