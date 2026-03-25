import { describe, expect, it } from 'vitest';
import { createSurface } from './surface.js';

describe('createSurface', () => {
  it('reuses cell objects when clearing a surface', () => {
    const surface = createSurface(2, 1, { char: 'x', fg: '#ffffff', empty: false });
    const first = surface.cells[0]!;
    const second = surface.cells[1]!;

    surface.set(0, 0, { char: 'A', fg: '#00ff00', bg: '#000000', empty: false });
    surface.set(1, 0, { char: 'B', fg: '#ff00ff', empty: false });
    surface.clear();

    expect(surface.cells[0]).toBe(first);
    expect(surface.cells[1]).toBe(second);
    expect(surface.get(0, 0)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: undefined,
      modifiers: undefined,
      empty: false,
      opacity: 1,
    });
    expect(surface.get(1, 0)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: undefined,
      modifiers: undefined,
      empty: false,
      opacity: 1,
    });
  });

  it('reuses the existing cell object when setting a cell', () => {
    const surface = createSurface(1, 1);
    const cellRef = surface.cells[0]!;

    surface.set(0, 0, {
      char: 'A',
      fg: '#ff0000',
      bg: '#001122',
      modifiers: ['bold'],
      empty: false,
      opacity: 0.5,
    });

    expect(surface.cells[0]).toBe(cellRef);
    expect(surface.get(0, 0)).toEqual({
      char: 'A',
      fg: '#ff0000',
      bg: '#001122',
      modifiers: ['bold'],
      empty: false,
      opacity: 0.5,
    });
  });

  it('leaves the target cell untouched for empty brush writes', () => {
    const surface = createSurface(1, 1);
    const cellRef = surface.cells[0]!;

    surface.set(0, 0, { char: 'A', fg: '#00ff00', empty: false });
    surface.set(0, 0, { char: 'Z', fg: '#ff0000', empty: true });

    expect(surface.cells[0]).toBe(cellRef);
    expect(surface.get(0, 0)).toEqual({
      char: 'A',
      fg: '#00ff00',
      bg: undefined,
      modifiers: undefined,
      empty: false,
      opacity: 1,
    });
  });
});
