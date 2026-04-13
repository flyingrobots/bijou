import { describe, expect, it } from 'vitest';
import { createSurface, type Surface, type LayoutNode } from '@flyingrobots/bijou';
import { normalizeViewOutput, normalizeViewOutputInto, wrapViewOutputAsLayoutRoot } from './view-output.js';

function surfaceLines(surface: Surface): string[] {
  return Array.from({ length: surface.height }, (_, y) =>
    Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join(''),
  );
}

describe('view output normalization', () => {
  it('re-roots non-zero-origin layout views before painting them', () => {
    const nodeSurface = createSurface(3, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    nodeSurface.set(2, 0, { char: 'C', empty: false });
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface: nodeSurface,
    };

    const normalized = normalizeViewOutput(layout, { width: 3, height: 1 });
    expect(surfaceLines(normalized.surface)).toEqual(['ABC']);
  });

  it('wraps layout views as local roots for the interactive pipeline', () => {
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface: createSurface(3, 1, { char: 'x', empty: false }),
    };

    const root = wrapViewOutputAsLayoutRoot(layout, { width: 3, height: 1 });
    expect(root.rect).toEqual({ x: 0, y: 0, width: 3, height: 1 });
  });

  it('pads localized layout output to the requested viewport size', () => {
    const nodeSurface = createSurface(2, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    const layout: LayoutNode = {
      rect: { x: 1, y: 1, width: 2, height: 1 },
      children: [],
      surface: nodeSurface,
    };

    const normalized = normalizeViewOutput(layout, { width: 4, height: 3 });
    expect(normalized.surface.width).toBe(4);
    expect(normalized.surface.height).toBe(3);
    expect(surfaceLines(normalized.surface)).toEqual([
      'AB  ',
      '    ',
      '    ',
    ]);
  });

  it('can paint layout output into a reusable scratch surface', () => {
    const nodeSurface = createSurface(2, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    const layout: LayoutNode = {
      rect: { x: 1, y: 1, width: 2, height: 1 },
      children: [],
      surface: nodeSurface,
    };
    const scratch = createSurface(4, 3);
    scratch.fill({ char: 'x', empty: false });

    const normalized = normalizeViewOutputInto(layout, { width: 4, height: 3 }, scratch);

    expect(normalized.surface).toBe(scratch);
    expect(surfaceLines(normalized.surface)).toEqual([
      'AB  ',
      '    ',
      '    ',
    ]);
  });

  it('explains the sanctioned surface bridge when a raw string reaches runtime normalization', () => {
    expect(() => normalizeViewOutput('plain text' as unknown as LayoutNode, { width: 10, height: 1 }))
      .toThrowError(
        'Bijou runtime views must return a Surface or LayoutNode. Raw strings are no longer supported; convert them with contentSurface(...), parseAnsiToSurface(...), or stringToSurface(...).',
      );
  });
});
