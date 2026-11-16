import { describe, expect, it } from 'vitest';
import { contrastRatio, dimmed, parseHex, themePalette, toHex } from './contrast.js';

const rgb = (hex: string) => {
  const value = parseHex(hex);
  if (value === undefined) throw new Error(`bad hex ${hex}`);
  return value;
};

describe('component audit contrast', () => {
  it('gives the WCAG reference ratios', () => {
    expect(contrastRatio(rgb('#000000'), rgb('#ffffff'))).toBeCloseTo(21, 5);
    expect(contrastRatio(rgb('#777777'), rgb('#ffffff'))).toBeCloseTo(4.48, 2);
    expect(contrastRatio(rgb('#ffffff'), rgb('#ffffff'))).toBeCloseTo(1, 5);
  });

  it('is symmetric in its arguments', () => {
    expect(contrastRatio(rgb('#336699'), rgb('#eeeeee'))).toBeCloseTo(contrastRatio(rgb('#eeeeee'), rgb('#336699')), 10);
  });

  it('parses short and long hex and rejects other strings', () => {
    expect(parseHex('#abc')).toEqual([0xaa, 0xbb, 0xcc]);
    expect(toHex(rgb('#A1B2C3'))).toBe('#a1b2c3');
    expect(parseHex('red')).toBeUndefined();
  });

  it('draws dim text halfway to the background, lowering its contrast', () => {
    expect(toHex(dimmed(rgb('#ffffff'), rgb('#000000')))).toBe('#808080');
    expect(contrastRatio(dimmed(rgb('#ffffff'), rgb('#000000')), rgb('#000000'))).toBeLessThan(21);
  });

  it('collects every hex colour in a nested theme object', () => {
    const palette = themePalette({ semantic: { accent: { hex: '#FF0000' } }, list: ['#00f', 'plain'], n: 3 });
    expect([...palette].sort()).toEqual(['#0000ff', '#ff0000']);
  });
});
