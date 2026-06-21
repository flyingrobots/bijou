import { describe, it, expect } from 'vitest';
import { color, colorHex, colorRgb, isResolvedColor, resolveColor, tryResolveColor } from './color.js';

describe('ColorRef helpers', () => {
  it('keeps literal hex strings lazy until resolution', () => {
    const ref = color('#123456');
    expect(ref).toBe('#123456');
    expect(isResolvedColor(ref)).toBe(false);
  });

  it('resolves a ColorRef into canonical hex plus rgb bytes', () => {
    const ref = resolveColor('#123456');
    expect(isResolvedColor(ref)).toBe(true);
    expect(ref.hex).toBe('#123456');
    expect(ref.rgb).toEqual([0x12, 0x34, 0x56]);
    expect(colorHex(ref)).toBe('#123456');
    expect(colorRgb(ref)).toEqual([0x12, 0x34, 0x56]);
  });

  it('returns undefined for invalid color refs on the non-throwing path', () => {
    expect(tryResolveColor('#oops')).toBeUndefined();
    expect(colorHex(undefined)).toBeUndefined();
    expect(colorRgb(undefined)).toBeUndefined();
  });
});
