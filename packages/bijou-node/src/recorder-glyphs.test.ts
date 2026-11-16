import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { rasterizeSurface } from './recorder.js';

const CW = 8;
const CH = 12;
const FG = [0xff, 0x00, 0x00] as const;
const BG = [0x00, 0x00, 0xff] as const;

function render(char: string): (x: number, y: number) => readonly number[] {
  const surface = createSurface(1, 1);
  surface.set(0, 0, { char, fg: '#ff0000', bg: '#0000ff', empty: false });
  const rgba = rasterizeSurface(surface, { cellWidth: CW, cellHeight: CH });
  return (x, y) => Array.from(rgba.slice((y * CW + x) * 4, (y * CW + x) * 4 + 3));
}

function region(char: string, x0: number, y0: number, x1: number, y1: number): readonly (readonly number[])[] {
  const px = render(char);
  const out: (readonly number[])[] = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) out.push(px(x, y));
  return out;
}

type Rect = readonly [number, number, number, number];

const allFg = (pixels: readonly (readonly number[])[]): boolean => pixels.every((p) => p.join() === FG.join());
const allBg = (pixels: readonly (readonly number[])[]): boolean => pixels.every((p) => p.join() === BG.join());
const anyFg = (pixels: readonly (readonly number[])[]): boolean => pixels.some((p) => p.join() === FG.join());

// Oracle: Unicode Block Elements chart (U+2580–U+259F) defines each glyph's filled fraction of the cell.
describe('recorder block elements', () => {
  it.each([
    ['▀ upper half', '▀', [0, 0, CW, CH / 2], [0, CH / 2, CW, CH]],
    ['▄ lower half', '▄', [0, CH / 2, CW, CH], [0, 0, CW, CH / 2]],
    ['▌ left half', '▌', [0, 0, CW / 2, CH], [CW / 2, 0, CW, CH]],
    ['▐ right half', '▐', [CW / 2, 0, CW, CH], [0, 0, CW / 2, CH]],
    ['▚ upper-left and lower-right quadrants', '▚', [0, 0, CW / 2, CH / 2], [CW / 2, 0, CW, CH / 2]],
  ] satisfies readonly (readonly [string, string, Rect, Rect])[])('fills exactly the %s', (_name, char, filled, empty) => {
    expect(allFg(region(char, ...filled))).toBe(true);
    expect(allBg(region(char, ...empty))).toBe(true);
  });

  it('fills the whole cell for the full block', () => {
    expect(allFg(region('█', 0, 0, CW, CH))).toBe(true);
  });

  it('draws a light shade as a blend strictly between foreground and background', () => {
    const [r, , b] = render('░')(3, 3);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(0xff);
    expect(b).toBeGreaterThan(r ?? 0);
  });
});

// Oracle: Unicode Braille Patterns (U+2800–U+28FF); bit n of the offset raises dot n+1 in a 2×4 grid.
describe('recorder braille patterns', () => {
  it('raises only dot 1 (top-left) for U+2801', () => {
    expect(anyFg(region('⠁', 0, 0, CW / 2, CH / 4))).toBe(true);
    expect(allBg(region('⠁', CW / 2, 0, CW, CH))).toBe(true);
    expect(allBg(region('⠁', 0, CH / 4, CW / 2, CH))).toBe(true);
  });

  it('raises a dot in each of the eight sub-cells for U+28FF', () => {
    const subcells = [0, 1, 2, 3].flatMap((row) => [0, 1].map((col) =>
      region('⣿', col * CW / 2, row * CH / 4, (col + 1) * CW / 2, (row + 1) * CH / 4)));
    expect(subcells.filter(anyFg)).toHaveLength(8);
  });

  it('draws nothing for the blank pattern U+2800', () => {
    expect(allBg(region('⠀', 0, 0, CW, CH))).toBe(true);
  });
});

// Oracle: Unicode Box Drawing (U+2500–U+257F); arms meet the cell edges so adjacent cells join.
describe('recorder box drawing', () => {
  it('runs a light horizontal line edge to edge', () => {
    const px = render('─');
    expect(px(0, CH / 2)).toEqual([...FG]);
    expect(px(CW - 1, CH / 2)).toEqual([...FG]);
  });

  it('runs a light vertical line edge to edge', () => {
    const px = render('│');
    expect(px(CW / 2, 0)).toEqual([...FG]);
    expect(px(CW / 2, CH - 1)).toEqual([...FG]);
  });

  it('extends a rounded top-left corner only to the right and bottom edges', () => {
    const px = render('╭');
    expect(px(CW - 1, CH / 2)).toEqual([...FG]);
    expect(px(CW / 2, CH - 1)).toEqual([...FG]);
    expect(px(0, CH / 2)).toEqual([...BG]);
    expect(px(CW / 2, 0)).toEqual([...BG]);
  });

  it('draws a heavy horizontal line thicker than a light one', () => {
    const thickness = (char: string): number => region(char, CW / 2, 0, CW / 2 + 1, CH).filter((p) => p.join() === FG.join()).length;
    expect(thickness('━')).toBeGreaterThan(thickness('─'));
  });

  it('draws a double horizontal line as two separated strokes', () => {
    const column = region('═', CW / 2, 0, CW / 2 + 1, CH).map((p) => p.join() === FG.join());
    const strokes = column.filter((on, i) => on && !column[i - 1]).length;
    expect(strokes).toBe(2);
  });

  it('joins a cross to all four edges', () => {
    const px = render('┼');
    expect([px(0, CH / 2), px(CW - 1, CH / 2), px(CW / 2, 0), px(CW / 2, CH - 1)]).toEqual([[...FG], [...FG], [...FG], [...FG]]);
  });
});
