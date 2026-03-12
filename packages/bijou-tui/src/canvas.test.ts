import { describe, it, expect } from 'vitest';
import { canvas, type ShaderFn } from './canvas.js';

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
    // U+2801 is dot 1 (top-left)
    expect(surface.get(0, 0).char).toBe('\u2801');
  });

  it('handles uniforms', () => {
    const shader: ShaderFn = ({ uniforms }) => uniforms.value;
    const surface = canvas(1, 1, shader, { uniforms: { value: 'Z' } });
    expect(surface.get(0, 0).char).toBe('Z');
  });
});
