import { describe, expect, it } from 'vitest';
import {
  lintModeLowering,
  modeLoweringReportText,
} from './mode-lowering.js';

describe('mode lowering linter', () => {
  it('reports missing, mismatched, duplicate, and custom semantic failures', () => {
    const report = lintModeLowering({
      baselineMode: 'interactive',
      modes: [
        {
          mode: 'interactive',
          facts: [
            { kind: 'entity', key: 'save-button' },
            { kind: 'count', key: 'rows', value: 3 },
            { kind: 'label', key: 'sparkline-glyphs', required: false },
          ],
        },
        {
          mode: 'pipe',
          facts: [
            { kind: 'count', key: 'rows', value: 2 },
            { kind: 'state', key: 'selected' },
            { kind: 'state', key: 'selected' },
          ],
        },
        {
          mode: 'accessible',
          facts: [
            { kind: 'entity', key: 'save-button' },
            { kind: 'count', key: 'rows', value: 3 },
          ],
        },
      ],
      assertions: [
        {
          passed: false,
          mode: 'accessible',
          key: 'shortcut-label',
          message: 'accessible text must name the keyboard shortcut',
        },
      ],
    });

    expect(report.passed).toBe(false);
    expect(report.checkedModes).toEqual(['interactive', 'pipe', 'accessible']);
    expect(report.issues.map((issue) => issue.kind)).toEqual([
      'duplicate-fact',
      'missing-required-fact',
      'mismatched-fact-value',
      'custom-assertion-failed',
    ]);
    expect(report.issues[1]?.message).toBe('pipe is missing required entity save-button from interactive');
    expect(report.issues[2]?.message).toBe('pipe count rows differs from interactive: expected 3, got 2');
    expect(report.issues[3]?.message).toBe('accessible text must name the keyboard shortcut');
  });

  it('returns a passing report when lower modes preserve required facts', () => {
    const report = lintModeLowering({
      modes: [
        {
          mode: 'interactive',
          facts: [
            { kind: 'entity', key: 'panel' },
            { kind: 'state', key: 'expanded', value: true },
          ],
        },
        {
          mode: 'pipe',
          facts: [
            { kind: 'entity', key: 'panel' },
            { kind: 'state', key: 'expanded', value: true },
          ],
        },
      ],
    });

    expect(report.passed).toBe(true);
    expect(report.baselineMode).toBe('interactive');
    expect(report.issues).toEqual([]);
  });

  it('renders deterministic text for diagnostics and reviews', () => {
    const report = lintModeLowering({
      modes: [
        {
          mode: 'interactive',
          facts: [{ kind: 'entity', key: 'active-row' }],
        },
        {
          mode: 'accessible',
          facts: [],
        },
      ],
    });

    expect(modeLoweringReportText(report)).toBe([
      'mode lowering: failed baseline=interactive checked=interactive,accessible',
      'issues:',
      '- error missing-required-fact mode=accessible fact=entity:active-row: accessible is missing required entity active-row from interactive',
    ].join('\n'));
  });
});
