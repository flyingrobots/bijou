import { describe, expect, it } from 'vitest';
import { solveGridRects, solveSplitAxisSizes, solveSplitPaneRects } from './geometry.js';

describe('solveSplitPaneRects', () => {
  it('solves row splits with divider geometry in foundation space', () => {
    const layout = solveSplitPaneRects({
      direction: 'row',
      width: 40,
      height: 8,
      ratio: 0.25,
      dividerSize: 1,
    });

    expect(layout.paneA).toEqual({ x: 0, y: 0, width: 10, height: 8 });
    expect(layout.divider).toEqual({ x: 10, y: 0, width: 1, height: 8 });
    expect(layout.paneB).toEqual({ x: 11, y: 0, width: 29, height: 8 });
  });

  it('respects min constraints when ratio would under-allocate a pane', () => {
    const layout = solveSplitPaneRects({
      direction: 'column',
      width: 12,
      height: 10,
      ratio: 0.1,
      minA: 3,
      minB: 5,
      dividerSize: 1,
    });

    expect(layout.paneA.height).toBe(3);
    expect(layout.paneB.height).toBe(6);
    expect(layout.divider.y).toBe(3);
  });
});

describe('solveSplitAxisSizes', () => {
  it('uses the same clamped axis math for resize consumers', () => {
    expect(solveSplitAxisSizes({
      available: 20,
      ratio: 0.5,
      minA: 3,
      minB: 4,
    })).toEqual({ paneA: 10, paneB: 10 });

    expect(solveSplitAxisSizes({
      available: 20,
      ratio: 0.95,
      minA: 3,
      minB: 8,
    })).toEqual({ paneA: 12, paneB: 8 });
  });
});

describe('solveGridRects', () => {
  it('solves fixed and fr tracks into deterministic rects', () => {
    const rects = solveGridRects({
      width: 40,
      height: 10,
      columns: [10, '1fr', '1fr'],
      rows: [2, '1fr'],
      areas: ['nav main main', 'nav body body'],
      gap: 1,
    });

    expect(rects.get('nav')).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    expect(rects.get('main')).toEqual({ x: 11, y: 0, width: 29, height: 2 });
    expect(rects.get('body')).toEqual({ x: 11, y: 3, width: 29, height: 7 });
  });

  it('throws for invalid fr tracks and non-rectangular areas', () => {
    expect(() => solveGridRects({
      width: 20,
      height: 4,
      columns: ['1.5fr', '1fr'],
      rows: ['1fr'],
      areas: ['a b'],
    })).toThrow(/invalid fr track/);

    expect(() => solveGridRects({
      width: 20,
      height: 10,
      columns: ['1fr', '1fr', '1fr'],
      rows: ['1fr', '1fr'],
      areas: ['a a b', 'a b b'],
    })).toThrow(/contiguous rectangle/);
  });
});
