import { describe, it, expect } from 'vitest';
import { calculateFlex } from './flex.js';

describe('calculateFlex', () => {
  it('splits space between fixed and flex children in row mode', () => {
    const root = calculateFlex(
      { direction: 'row', gap: 0 },
      [
        { basis: 20 },
        { flex: 1 },
      ],
      { x: 0, y: 0, width: 100, height: 10 }
    );

    expect(root.children).toHaveLength(2);
    expect(root.children[0]!.rect).toEqual({ x: 0, y: 0, width: 20, height: 10 });
    expect(root.children[1]!.rect).toEqual({ x: 20, y: 0, width: 80, height: 10 });
  });

  it('handles gaps in column mode', () => {
    const root = calculateFlex(
      { direction: 'column', gap: 1 },
      [
        { basis: 2 },
        { basis: 2 },
      ],
      { x: 0, y: 0, width: 20, height: 10 }
    );

    expect(root.children).toHaveLength(2);
    expect(root.children[0]!.rect).toEqual({ x: 0, y: 0, width: 20, height: 2 });
    expect(root.children[1]!.rect).toEqual({ x: 0, y: 3, width: 20, height: 2 });
  });

  it('respects min/max constraints', () => {
    const root = calculateFlex(
      { direction: 'row' },
      [
        { flex: 1, maxSize: 30 },
        { flex: 1 },
      ],
      { x: 0, y: 0, width: 100, height: 10 }
    );

    expect(root.children[0]!.rect.width).toBe(30);
    expect(root.children[1]!.rect.width).toBe(70);
  });
});
