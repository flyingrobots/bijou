import { describe, it, expect } from 'vitest';
import { visibleLength } from './viewport.js';
import { gridLayout, grid } from './grid.js';

describe('gridLayout', () => {
  it('solves fixed + fr tracks', () => {
    const rects = gridLayout({
      width: 40,
      height: 10,
      columns: [10, '1fr', '1fr'],
      rows: [2, '1fr'],
      areas: ['nav main main', 'nav body body'],
      gap: 1,
    });

    const nav = rects.get('nav');
    const main = rects.get('main');
    const body = rects.get('body');

    expect(nav).toBeDefined();
    expect(main).toBeDefined();
    expect(body).toBeDefined();
    expect(nav!.width).toBe(10);
    expect(main!.col).toBeGreaterThan(nav!.col);
  });

  it('clamps fixed columns when they exceed available width', () => {
    const rects = gridLayout({
      width: 10,
      height: 2,
      columns: [8, 8],
      rows: [2],
      areas: ['a b'],
      gap: 1,
    });

    expect(rects.get('a')?.width).toBe(8);
    expect(rects.get('b')?.width).toBe(1);
    expect(rects.get('b')?.col).toBe(9);
  });

  it('clamps fixed rows when they exceed available height', () => {
    const rects = gridLayout({
      width: 6,
      height: 7,
      columns: [6],
      rows: [5, 5],
      areas: ['top', 'bottom'],
      gap: 1,
    });

    expect(rects.get('top')?.height).toBe(5);
    expect(rects.get('bottom')?.height).toBe(1);
    expect(rects.get('bottom')?.row).toBe(6);
  });

  it('throws when area rows mismatch tracks', () => {
    expect(() => gridLayout({
      width: 10,
      height: 10,
      columns: [5, 5],
      rows: [5, 5],
      areas: ['a b'],
    })).toThrow(/areas row count/);
  });

  it('throws on non-rectangular named area', () => {
    expect(() => gridLayout({
      width: 20,
      height: 10,
      columns: ['1fr', '1fr', '1fr'],
      rows: ['1fr', '1fr'],
      areas: ['a a b', 'a b b'],
    })).toThrow(/contiguous rectangle/);
  });
});

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
});
