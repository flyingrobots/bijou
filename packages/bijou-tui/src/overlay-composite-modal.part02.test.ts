import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { compositeSurface, compositeSurfaceInto } from './overlay.js';
import type { Overlay } from './overlay.js';

describe('compositeSurface', () => {
  it('paints overlay surfaces onto a background surface', () => {
    const bg = stringToSurface('AAAA\nBBBB\nCCCC', 4, 3);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX\nYY', 2, 2),
      row: 1,
      col: 1,
    };
    const result = compositeSurface(bg, [ov]);
    expect(surfaceToString(result, createTestContext().style)).toBe('AAAA\nBXXB\nCYYC');
  });
  it('dims background cells without dimming overlay cells', () => {
    const ctx = createTestContext();
    const bg = stringToSurface('AAAA', 4, 1);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX', 2, 1),
      row: 0,
      col: 1,
    };
    const result = compositeSurface(bg, [ov], { dim: true });
    expect(result.get(0, 0).modifiers).toContain('dim');
    expect(result.get(1, 0).modifiers ?? []).not.toContain('dim');
    expect(surfaceToString(result, ctx.style)).toBe('AXXA');
  });
  it('can composite in place without cloning the target surface', () => {
    const ctx = createTestContext();
    const bg = stringToSurface('AAAA', 4, 1);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX', 2, 1),
      row: 0,
      col: 1,
    };
    const result = compositeSurfaceInto(bg, bg, [ov], { dim: true });
    expect(result).toBe(bg);
    expect(result.get(0, 0).modifiers).toContain('dim');
    expect(result.get(1, 0).modifiers ?? []).not.toContain('dim');
    expect(surfaceToString(result, ctx.style)).toBe('AXXA');
  });
});
