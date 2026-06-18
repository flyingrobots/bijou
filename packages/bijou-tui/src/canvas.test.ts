import { describe, it, expect } from 'vitest';
import { canvas, type ShaderFn } from './canvas.js';
import { must } from '@flyingrobots/bijou/adapters/test';
describe('canvas()', () => {
  it('calls shader with normalized UV and time', () => {
    const calls: any[] = [];
    const shader: ShaderFn = ({ u, v, time }) => {
      calls.push({ u, v, time });
      return '.';
    };
    canvas(3, 2, shader, { time: 42 });
    expect(calls).toHaveLength(6); // 3×2
    expect(calls[0]).toEqual({ u: 0, v: 0, time: 42 });
    expect(calls[5]).toEqual({ u: 1, v: 1, time: 42 });
  });
  it('produces a Surface of exactly cols x rows', () => {
    const surface = canvas(5, 3, () => 'X');
    expect(surface.width).toBe(5);
    expect(surface.height).toBe(3);
    expect(surface.get(0, 0).char).toBe('X');
  });
  it('handles rich cell returns with colors', () => {
    const shader: ShaderFn = ({ u }) => ({
      char: '!',
      fg: u > 0.5 ? '#ff0000' : '#0000ff'
    });
    const surface = canvas(2, 1, shader);
    expect(surface.get(0, 0).fg).toBe('#0000ff');
    expect(surface.get(1, 0).fg).toBe('#ff0000');
  });
  it('supports quad resolution (2x2 sub-pixels)', () => {
    const calls: any[] = [];
    const shader: ShaderFn = ({ u, v }) => {
      calls.push({ u, v });
      // Top-left and bottom-right on
      if ((u < 0.5 && v < 0.5) || (u > 0.5 && v > 0.5)) return 'X';
      return ' ';
    };
    const surface = canvas(1, 1, shader, { resolution: 'quad' });
    expect(calls).toHaveLength(4); // 2x2
    // ▚ is top-left + bottom-right
    expect(surface.get(0, 0).char).toBe('▚');
  });
  it('supports braille resolution (2x4 sub-pixels)', () => {
    const calls: any[] = [];
    const shader: ShaderFn = ({ u, v }) => {
      calls.push({ u, v });
      // Only top-left dot on
      if (u < 0.5 && v < 0.25) return 'X';
      return ' ';
    };
    const surface = canvas(1, 1, shader, { resolution: 'braille' });
    expect(calls).toHaveLength(8); // 2x4
    expect(surface.get(0, 0).char).toBe('\u2801');
  });
  it('averages braille sub-pixel foreground colors', () => {
    const samples = [
      [0, 0, 0],
      [8, 16, 24],
      [16, 32, 48],
      [24, 48, 72],
      [32, 64, 96],
      [40, 80, 120],
      [48, 96, 144],
      [56, 112, 168],
    ] as const;
    let index = 0;
    const shader: ShaderFn = () => ({
      char: 'X',
      fgRGB: must(samples[index++]),
    });
    const surface = canvas(1, 1, shader, { resolution: 'braille' });
    const cell = surface.get(0, 0);
    expect(cell.char).toBe('\u28ff');
    expect(cell.fgRGB).toEqual([28, 56, 84]);
  });
  it('preserves averaged braille background colors for empty cells', () => {
    const samples = [
      [0, 10, 20],
      [8, 18, 28],
      [16, 26, 36],
      [24, 34, 44],
      [32, 42, 52],
      [40, 50, 60],
      [48, 58, 68],
      [56, 66, 76],
    ] as const;
    let index = 0;
    const shader: ShaderFn = () => ({
      char: ' ',
      bgRGB: must(samples[index++]),
    });
    const surface = canvas(1, 1, shader, { resolution: 'braille' });
    const cell = surface.get(0, 0);
    expect(cell.char).toBe('\u2800');
    expect(cell.bgRGB).toEqual([28, 38, 48]);
  });
  it('averages quad sub-pixel foreground colors', () => {
    const samples = [
      { char: 'X', fgRGB: [0, 0, 0] },
      { char: ' ', fgRGB: [10, 20, 30] },
      { char: ' ', fgRGB: [20, 40, 60] },
      { char: 'X', fgRGB: [30, 60, 90] },
    ] as const;
    let index = 0;
    const shader: ShaderFn = () => must(samples[index++]);
    const surface = canvas(1, 1, shader, { resolution: 'quad' });
    const cell = surface.get(0, 0);
    expect(cell.char).toBe('▚');
    expect(cell.fgRGB).toEqual([15, 30, 45]);
  });
  it('fits glyph resolution from 2x4 diagonal coverage', () => {
    const coverage = [0, 1, 0, 1, 1, 0, 1, 0];
    let index = 0;
    const shader: ShaderFn = () => coverage[index++] === 1 ? 'X' : ' ';
    const surface = canvas(1, 1, shader, { resolution: 'glyph' });
    expect(index).toBe(8);
    expect(surface.get(0, 0).char).toBe('╱');
  });
  it('fits glyph resolution with the ASCII density ramp', () => {
    const surface = canvas(1, 1, () => 'X', {
      resolution: 'glyph',
      glyphFit: { mode: 'ascii' },
    });
    expect(surface.get(0, 0).char).toBe('@');
  });
  it('averages glyph-fit sub-pixel colors', () => {
    const samples = [
      { char: 'X', fgRGB: [0, 0, 0] },
      { char: ' ', fgRGB: [8, 16, 24] },
      { char: 'X', fgRGB: [16, 32, 48] },
      { char: ' ', fgRGB: [24, 48, 72] },
      { char: 'X', fgRGB: [32, 64, 96] },
      { char: ' ', fgRGB: [40, 80, 120] },
      { char: 'X', fgRGB: [48, 96, 144] },
      { char: ' ', fgRGB: [56, 112, 168] },
    ] as const;
    let index = 0;
    const shader: ShaderFn = () => must(samples[index++]);
    const surface = canvas(1, 1, shader, { resolution: 'glyph' });
    expect(surface.get(0, 0).fgRGB).toEqual([28, 56, 84]);
  });
  it('handles uniforms', () => {
    const shader: ShaderFn = ({ uniforms }) => uniforms.value;
    const surface = canvas(1, 1, shader, { uniforms: { value: 'Z' } });
    expect(surface.get(0, 0).char).toBe('Z');
  });
});
