import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth, stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { boxSurface } from './box-v3.js';
import { separatorSurface } from './separator-v3.js';
import { clipSurfaceCells, createSegmentSurface, createTextSurface, segmentSurfaceText } from './surface-text.js';

function plainRows(surface: Parameters<typeof surfaceToString>[0]): string[] {
  const ctx = createTestContext({ mode: 'interactive' });
  return stripAnsi(surfaceToString(surface, ctx.style)).split('\n');
}

describe('surface text places wide graphemes in two cells (flyingrobots/bijou#859)', () => {
  it('createTextSurface makes 漢字 four cells wide: each lead cell, then an empty continuation', () => {
    const surface = createTextSurface('漢字');

    expect(surface.width).toBe(4);
    expect([0, 1, 2, 3].map((x) => surface.get(x, 0).char)).toEqual(['漢', '', '字', '']);
    expect(plainRows(surface)).toEqual(['漢字']);
  });

  it('createTextSurface measures each line by display columns, Hangul and emoji included', () => {
    const surface = createTextSurface('한국\nab😀');

    expect(surface.width).toBe(4);
    expect(plainRows(surface).map((row) => graphemeWidth(row.trimEnd()))).toEqual([4, 4]);
  });

  it('segmentSurfaceText gives one entry per cell', () => {
    expect(segmentSurfaceText('😀x')).toEqual(['😀', '', 'x']);
  });

  it('createSegmentSurface sums display columns across segments', () => {
    expect(createSegmentSurface([{ text: 'a' }, { text: '漢' }]).width).toBe(3);
  });

  it('separatorSurface centres a wide label and fills exactly the requested columns', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rows = plainRows(separatorSurface({ label: '日本', width: 20, ctx }));

    expect(rows[0]).toContain(' 日本 ');
    expect(graphemeWidth(rows[0] ?? '')).toBe(20);
  });

  it('separatorSurface never cuts a wide grapheme in half when the label overflows', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    for (let width = 3; width <= 12; width += 1) {
      const row = plainRows(separatorSurface({ label: 'あいうえお', width, ctx }))[0] ?? '';
      expect(graphemeWidth(row), `width ${String(width)}`).toBe(width);
    }
  });

  it('boxSurface draws wide content and a wide title inside the requested width', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rows = plainRows(boxSurface(createTextSurface('漢字'), { title: '日本', width: 12, ctx }));

    expect(rows.every((row) => graphemeWidth(row) === 12)).toBe(true);
    expect(rows.join('\n')).toContain('漢字');
    expect(rows[0]).toContain(' 日本 ');
  });

  it('clipSurfaceCells turns a lead cut from its continuation, or a continuation cut from its lead, into a space', () => {
    const cells = segmentSurfaceText('a漢b');

    expect(clipSurfaceCells(cells, 0, 2)).toEqual(['a', ' ']);
    expect(clipSurfaceCells(cells, 2, 4)).toEqual([' ', 'b']);
    expect(clipSurfaceCells(cells, 0, 4)).toEqual(['a', '漢', '', 'b']);
  });

  it('clipSurfaceCells gives no cells for an empty or reversed range, negative ends included', () => {
    const cells = segmentSurfaceText('abc');

    expect(clipSurfaceCells(cells, 0, -1)).toEqual([]);
    expect(clipSurfaceCells(cells, 2, 1)).toEqual([]);
    expect(clipSurfaceCells(cells, -3, 1)).toEqual(['a']);
  });
});
