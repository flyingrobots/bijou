import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { grid, gridSurface } from './grid.js';
import { visibleLength } from './viewport.js';

describe('grid render', () => {
  it('renders exact dimensions', () => {
    const output = grid({
      width: 20,
      height: 6,
      columns: ['1fr', '1fr'],
      rows: [2, '1fr'],
      areas: ['top top', 'left right'],
      gap: 1,
      cells: {
        top: () => 'TOP',
        left: () => 'LEFT',
        right: () => 'RIGHT',
      },
    });
    const lines = output.split('\n');
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(20);
    }
    expect(output).toContain('TOP');
    expect(output).toContain('LEFT');
    expect(output).toContain('RIGHT');
  });
  it('throws when a renderer is missing', () => {
    expect(() => grid({
      width: 10,
      height: 4,
      columns: ['1fr'],
      rows: ['1fr'],
      areas: ['only'],
      cells: {},
    })).toThrow(/missing renderer/);
  });
  it('renders exact dimensions on the surface path', () => {
    const ctx = createTestContext();
    const surface = gridSurface({
      width: 20,
      height: 6,
      columns: ['1fr', '1fr'],
      rows: [2, '1fr'],
      areas: ['top top', 'left right'],
      gap: 1,
      cells: {
        top: () => stringToSurface('TOP', 3, 1),
        left: () => stringToSurface('LEFT', 4, 1),
        right: () => stringToSurface('RIGHT', 5, 1),
      },
    });
    expect(surface.width).toBe(20);
    expect(surface.height).toBe(6);
    const lines = surfaceToString(surface, ctx.style).split('\n');
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(20);
    }
    expect(lines.join('\n')).toContain('TOP');
    expect(lines.join('\n')).toContain('LEFT');
    expect(lines.join('\n')).toContain('RIGHT');
  });
  it('preserves structured cell styling on the surface path', () => {
    const surface = gridSurface({
      width: 8,
      height: 3,
      columns: ['1fr'],
      rows: ['1fr'],
      areas: ['only'],
      cells: {
        only: () => createSurface(2, 1, { char: 'X', fg: '#ff00ff', bg: '#101010', empty: false }),
      },
    });
    expect(surface.get(0, 0).char).toBe('X');
    expect(surface.get(0, 0).fg).toBe('#ff00ff');
    expect(surface.get(0, 0).bg).toBe('#101010');
  });
});
