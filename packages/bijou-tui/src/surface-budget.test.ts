import { createSurface } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { evaluateSurfaceBudget } from './surface-budget.js';

describe('surface budget warnings', () => {
  it('reports surface size, style, frame, and stage threshold violations', () => {
    const surface = createSurface(3, 2, { char: '.', empty: false });
    surface.set(0, 0, { char: 'A', fg: '#ff0000', empty: false });
    surface.set(1, 0, { char: 'B', bg: '#0000ff', empty: false });

    const warnings = evaluateSurfaceBudget({
      label: 'preview',
      surface,
      timings: [
        { stage: 'Layout', durationMs: 12 },
        { stage: 'Paint', durationMs: 4 },
      ],
      thresholds: {
        maxArea: 5,
        maxStyledCells: 1,
        maxFrameDurationMs: 10,
        maxStageDurationMs: { Layout: 8 },
      },
    });

    expect(warnings.map((warning) => warning.metric)).toEqual([
      'surface-area',
      'styled-cells',
      'frame-duration',
      'stage-duration',
    ]);
    expect(warnings[0]).toMatchObject({
      label: 'preview',
      actual: 6,
      limit: 5,
      message: 'preview surface-area 6 > 5',
    });
    expect(warnings[1]).toMatchObject({ actual: 2, limit: 1 });
    expect(warnings[2]).toMatchObject({ actual: 16, limit: 10 });
    expect(warnings[3]).toMatchObject({
      stage: 'Layout',
      actual: 12,
      limit: 8,
      message: 'preview stage-duration Layout 12ms > 8ms',
    });
  });

  it('returns no warnings when thresholds are not exceeded', () => {
    const surface = createSurface(2, 2, { char: '.', empty: false });

    const warnings = evaluateSurfaceBudget({
      surface,
      timings: [{ stage: 'Paint', durationMs: 1 }],
      thresholds: {
        maxWidth: 4,
        maxHeight: 4,
        maxArea: 8,
        maxStyledCells: 0,
        maxFrameDurationMs: 5,
        maxStageDurationMs: { Paint: 5 },
      },
    });

    expect(warnings).toEqual([]);
  });
});
