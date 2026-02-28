import { describe, it, expect } from 'vitest';
import { canvas, type ShaderFn } from './canvas.js';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('canvas()', () => {
  it('calls shader(x, y, cols, rows, time) for every cell', () => {
    const calls: [number, number, number, number, number][] = [];
    const shader: ShaderFn = (x, y, cols, rows, time) => {
      calls.push([x, y, cols, rows, time]);
      return '.';
    };
    const ctx = createTestContext({ mode: 'interactive' });
    canvas(3, 2, shader, { time: 42, ctx });
    expect(calls).toHaveLength(6); // 3×2
    expect(calls[0]).toEqual([0, 0, 3, 2, 42]);
    expect(calls[5]).toEqual([2, 1, 3, 2, 42]);
  });

  it('produces exactly rows lines, each cols chars wide', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = canvas(5, 3, () => 'X', { ctx });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).toHaveLength(5);
    }
  });

  it('truncates multi-char return to first character', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = canvas(3, 1, () => 'ABC', { ctx });
    expect(result).toBe('AAA');
  });

  it('handles non-BMP emoji shader output without surrogate corruption', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = canvas(3, 1, () => '🔥', { ctx });
    expect(result).toBe('🔥🔥🔥');
  });

  it('substitutes space for empty return', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = canvas(3, 1, () => '', { ctx });
    expect(result).toBe('   ');
  });

  it('time defaults to 0', () => {
    let capturedTime = -1;
    const ctx = createTestContext({ mode: 'interactive' });
    canvas(1, 1, (_x, _y, _c, _r, time) => {
      capturedTime = time;
      return '.';
    }, { ctx });
    expect(capturedTime).toBe(0);
  });

  it('cols=0 returns empty string', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(canvas(0, 5, () => 'X', { ctx })).toBe('');
  });

  it('rows=0 returns empty string', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(canvas(5, 0, () => 'X', { ctx })).toBe('');
  });

  describe('pipe mode', () => {
    it('returns empty string', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(canvas(10, 5, () => 'X', { ctx })).toBe('');
    });
  });

  describe('accessible mode', () => {
    it('returns empty string', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      expect(canvas(10, 5, () => 'X', { ctx })).toBe('');
    });
  });
});
