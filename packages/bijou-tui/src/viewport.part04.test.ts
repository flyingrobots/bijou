import { describe, it, expect } from 'vitest';
import { createSurface, type LayoutNode } from '@flyingrobots/bijou';
import { createScrollStateForContent } from './viewport.js';

describe('createScrollStateForContent', () => {
  it('derives bounds from structured surface content', () => {
    const content = createSurface(10, 8);
    const state = createScrollStateForContent(content, 3, 4);
    expect(state.y).toBe(0);
    expect(state.maxY).toBe(5);
    expect(state.maxX).toBe(6);
    expect(state.totalLines).toBe(8);
  });
  it('derives bounds from layout-node content', () => {
    const childSurface = createSurface(6, 1, { char: 'x', empty: false });
    const layout: LayoutNode = {
      rect: { x: 0, y: 0, width: 2, height: 2 },
      children: [
        {
          rect: { x: 0, y: 4, width: 6, height: 1 },
          children: [],
          surface: childSurface,
        },
      ],
    };
    const state = createScrollStateForContent(layout, 2, 4);
    expect(state.maxY).toBe(3);
    expect(state.maxX).toBe(2);
    expect(state.totalLines).toBe(5);
  });
  it('ignores absolute root offsets when deriving layout-node bounds', () => {
    const surface = createSurface(3, 1, { char: 'x', empty: false });
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface,
    };
    const state = createScrollStateForContent(layout, 1, 3);
    expect(state.maxY).toBe(0);
    expect(state.maxX).toBe(0);
    expect(state.totalLines).toBe(1);
  });
});
