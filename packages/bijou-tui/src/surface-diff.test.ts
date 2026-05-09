import { describe, expect, it } from 'vitest';
import { createSurface, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  diffSurfaces,
  surfaceDiffSurface,
  surfaceDiffText,
} from './surface-diff.js';

describe('surface diff viewer', () => {
  it('separates character changes from style-only changes and reports bounds', () => {
    const before = createSurface(3, 2);
    before.set(0, 0, { char: 'a', fg: '#ffffff', empty: false });
    before.set(1, 0, { char: 'b', fg: '#ffffff', empty: false });
    before.set(2, 1, { char: 'c', fg: '#ffffff', empty: false });

    const after = createSurface(3, 2);
    after.set(0, 0, { char: 'a', fg: '#ffffff', empty: false });
    after.set(1, 0, { char: 'B', fg: '#ffffff', empty: false });
    after.set(2, 1, { char: 'c', fg: '#ffcc00', empty: false });

    const diff = diffSurfaces(before, after);

    expect(diff.changedCells).toBe(2);
    expect(diff.charChanges).toBe(1);
    expect(diff.styleOnlyChanges).toBe(1);
    expect(diff.bounds).toEqual({ x: 1, y: 0, width: 2, height: 2 });
    expect(diff.cells.map((cell) => [cell.x, cell.y, cell.kind])).toEqual([
      [1, 0, 'char'],
      [2, 1, 'style'],
    ]);
  });

  it('counts added cells when surface dimensions differ', () => {
    const before = createSurface(1, 1);
    before.set(0, 0, { char: 'x', empty: false });

    const after = createSurface(2, 1);
    after.set(0, 0, { char: 'x', empty: false });
    after.set(1, 0, { char: 'y', empty: false });

    const diff = diffSurfaces(before, after);

    expect(diff.width).toBe(2);
    expect(diff.height).toBe(1);
    expect(diff.changedCells).toBe(1);
    expect(diff.charChanges).toBe(1);
    expect(diff.bounds).toEqual({ x: 1, y: 0, width: 1, height: 1 });
  });

  it('renders a side-by-side viewer surface', () => {
    const before = createSurface(2, 1);
    before.set(0, 0, { char: 'a', empty: false });
    before.set(1, 0, { char: 'b', empty: false });
    const after = createSurface(2, 1);
    after.set(0, 0, { char: 'a', empty: false });
    after.set(1, 0, { char: 'B', empty: false });

    const surface = surfaceDiffSurface(before, after, { mode: 'side-by-side' });
    const text = surfaceToString(surface, createTestContext().style);

    expect(text).toContain('surface diff: 1 changed, 1 char, 0 style');
    expect(text).toContain('before | after');
    expect(text).toContain('ab | aB');
  });

  it('renders an overlay viewer surface with changed cells marked', () => {
    const before = createSurface(3, 1);
    before.set(0, 0, { char: 'a', empty: false });
    before.set(1, 0, { char: 'b', empty: false });
    before.set(2, 0, { char: 'c', empty: false });
    const after = createSurface(3, 1);
    after.set(0, 0, { char: 'a', empty: false });
    after.set(1, 0, { char: 'B', empty: false });
    after.set(2, 0, { char: 'c', empty: false });

    const surface = surfaceDiffSurface(before, after, { mode: 'overlay' });
    const text = surfaceToString(surface, createTestContext().style);

    expect(text).toContain('surface diff: 1 changed, 1 char, 0 style');
    expect(text).toContain('aBc');
    expect(text).toContain('.!.');
  });

  it('renders a coordinate text report for test output', () => {
    const before = createSurface(2, 1);
    before.set(0, 0, { char: 'x', fg: '#ffffff', empty: false });
    before.set(1, 0, { char: 'y', fg: '#ffffff', empty: false });
    const after = createSurface(2, 1);
    after.set(0, 0, { char: 'X', fg: '#ffffff', empty: false });
    after.set(1, 0, { char: 'y', fg: '#00ffaa', empty: false });

    const report = surfaceDiffText(before, after);

    expect(report).toContain('surface diff: 2 changed, 1 char, 1 style');
    expect(report).toContain('(0,0) char "x" -> "X"');
    expect(report).toContain('(1,0) style');
  });
});
