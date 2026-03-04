import { describe, it, expect } from 'vitest';
import { encodeArrowPos, decodeArrowPos } from './dag-edges.js';

describe('encodeArrowPos / decodeArrowPos', () => {
  it('round-trips a typical position', () => {
    const encoded = encodeArrowPos(42, 137);
    expect(decodeArrowPos(encoded)).toEqual({ row: 42, col: 137 });
  });

  it('round-trips zero', () => {
    const encoded = encodeArrowPos(0, 0);
    expect(decodeArrowPos(encoded)).toEqual({ row: 0, col: 0 });
  });

  it('round-trips max values (65535, 65535)', () => {
    const encoded = encodeArrowPos(65535, 65535);
    expect(decodeArrowPos(encoded)).toEqual({ row: 65535, col: 65535 });
  });

  it('round-trips max row with zero col', () => {
    const encoded = encodeArrowPos(65535, 0);
    expect(decodeArrowPos(encoded)).toEqual({ row: 65535, col: 0 });
  });

  it('round-trips zero row with max col', () => {
    const encoded = encodeArrowPos(0, 65535);
    expect(decodeArrowPos(encoded)).toEqual({ row: 0, col: 65535 });
  });

  it('produces distinct encodings for different positions', () => {
    const a = encodeArrowPos(1, 2);
    const b = encodeArrowPos(2, 1);
    expect(a).not.toBe(b);
  });
});
