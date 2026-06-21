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

  it('produces distinct encodings for (0,1) vs (1,0)', () => {
    expect(encodeArrowPos(0, 1)).not.toBe(encodeArrowPos(1, 0));
  });

  it('produces distinct encodings for (256,0) vs (0,256)', () => {
    expect(encodeArrowPos(256, 0)).not.toBe(encodeArrowPos(0, 256));
  });

  it('silently wraps on overflow (65536,0) same as (0,0)', () => {
    // Documents the 16-bit limit — not a bug, just the documented range
    const overflow = encodeArrowPos(65536, 0);
    const zero = encodeArrowPos(0, 0);
    expect(overflow).toBe(zero);
  });
});
