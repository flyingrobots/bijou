import { describe, it, expect } from 'vitest';
import { createSurface, type LayoutNode } from '@flyingrobots/bijou';
import { viewportSurface } from './viewport.js';

function surfaceLines(surface: { width: number; height: number; get(x: number, y: number): { char: string } }): string[] {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines;
}

describe('viewportSurface', () => {
  it('renders string content into a surface with the same viewport clipping', () => {
    const result = viewportSurface({
      width: 6,
      height: 2,
      content: 'alpha\nbeta\ngamma',
      scrollY: 1,
      showScrollbar: false,
    });
    expect(surfaceLines(result)).toEqual(['beta  ', 'gamma ']);
  });
  it('clips and scrolls existing surfaces without flattening them', () => {
    const content = createSurface(4, 3);
    content.set(0, 0, { char: 'A', fg: '#ff0000', empty: false });
    content.set(1, 0, { char: 'B', empty: false });
    content.set(2, 1, { char: 'C', fg: '#00ff00', empty: false });
    content.set(3, 2, { char: 'D', fg: '#0000ff', empty: false });
    const result = viewportSurface({
      width: 2,
      height: 2,
      content,
      scrollX: 1,
      scrollY: 1,
      showScrollbar: false,
    });
    expect(surfaceLines(result)).toEqual([' C', '  ']);
    expect(result.get(1, 0)).toMatchObject({ char: 'C', fg: '#00ff00' });
  });
  it('accepts layout-node content and masks the painted result', () => {
    const nodeSurface = createSurface(5, 4, { char: '.', empty: false });
    nodeSurface.set(2, 3, { char: 'Z', fg: '#ff00ff', empty: false });
    const layout: LayoutNode = {
      rect: { x: 0, y: 0, width: 5, height: 4 },
      children: [],
      surface: nodeSurface,
    };
    const result = viewportSurface({
      width: 3,
      height: 2,
      content: layout,
      scrollY: 2,
      showScrollbar: false,
    });
    expect(surfaceLines(result)).toEqual(['...', '..Z']);
    expect(result.get(2, 1)).toMatchObject({ char: 'Z', fg: '#ff00ff' });
  });
  it('re-roots non-zero-origin layout-node content before masking', () => {
    const nodeSurface = createSurface(3, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    nodeSurface.set(2, 0, { char: 'C', empty: false });
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface: nodeSurface,
    };
    const result = viewportSurface({
      width: 3,
      height: 1,
      content: layout,
      showScrollbar: false,
    });
    expect(surfaceLines(result)).toEqual(['ABC']);
  });
  it('supports overlay scrollbars for structured surfaces without shrinking the body width', () => {
    const content = createSurface(5, 4, { char: ' ', empty: false });
    for (const [y, row] of ['abcde', 'fghij', 'klmno', 'pqrst'].entries()) {
      for (const [x, char] of row.split('').entries()) {
        content.set(x, y, { char, empty: false });
      }
    }
    const result = viewportSurface({
      width: 5,
      height: 2,
      content,
      showScrollbar: true,
      scrollbarMode: 'overlay',
    });
    expect(surfaceLines(result)).toEqual(['abcd█', 'fghi│']);
  });
});
