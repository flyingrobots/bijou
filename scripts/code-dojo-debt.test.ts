import { describe, expect, it } from 'vitest';
import { formatCodeDojoDebt, summarizeCodeDojoDebt } from './code-dojo-debt.js';

describe('code-dojo debt summary', () => {
  it('aggregates baseline-backed standards violations', () => {
    const summary = summarizeCodeDojoDebt({
      fileContextEntries: [{}, {}],
      mockBanViolations: [{}],
      codeSizeBaseline: [
        { path: 'src/a.ts', lines: 501 },
        { path: 'src/b.ts', lines: 750 },
        { path: 'src/c.ts', lines: 1001 },
      ],
    });

    expect(summary.fileContextViolations).toBe(2);
    expect(summary.mockBanViolations).toBe(1);
    expect(summary.codeSizeViolations).toBe(3);
    expect(summary.codeSizeHardLimitViolations).toBe(1);
    expect(summary.totalViolations).toBe(6);
  });

  it('computes the next goalpost target by removing 50 violations', () => {
    const summary = summarizeCodeDojoDebt({
      fileContextEntries: Array.from({ length: 80 }),
      mockBanViolations: Array.from({ length: 20 }),
      codeSizeBaseline: Array.from({ length: 20 }, (_, index) => ({
        path: `src/${index}.ts`,
        lines: 501,
      })),
    });

    expect(summary.totalViolations).toBe(120);
    expect(summary.nextGoalpostTarget).toBe(70);
  });

  it('targets zero when fewer than 50 violations remain', () => {
    const summary = summarizeCodeDojoDebt({
      fileContextEntries: Array.from({ length: 10 }),
      mockBanViolations: [],
      codeSizeBaseline: [],
    });

    expect(summary.totalViolations).toBe(10);
    expect(summary.nextGoalpostTarget).toBe(0);
  });

  it('formats the goalpost burndown policy', () => {
    const summary = summarizeCodeDojoDebt({
      fileContextEntries: [{}],
      mockBanViolations: [{}],
      codeSizeBaseline: [{ path: 'src/a.ts', lines: 1001 }],
    });

    expect(formatCodeDojoDebt(summary)).toContain('every met goalpost must remove at least 50 violations until zero');
    expect(formatCodeDojoDebt(summary)).toContain('Next goalpost target from this count: <= 0 violations.');
  });
});
