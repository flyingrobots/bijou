import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------
describe('timeline builder', () => {
  it('builds a timeline with a single tween track', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 100, duration: 500 })
      .build();
    expect(tl.trackNames).toEqual(['x']);
    expect(tl.estimatedDurationMs).toBe(500);
  });
  it('builds a timeline with a single spring track', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'stiff' })
      .build();
    expect(tl.trackNames).toEqual(['x']);
    expect(tl.estimatedDurationMs).toBeGreaterThan(0);
  });
  it('builds a timeline with multiple tracks', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 100, duration: 300 })
      .add('y', { type: 'tween', from: 0, to: 50, duration: 200 })
      .build();
    expect(tl.trackNames).toEqual(['x', 'y']);
    // y starts at 300ms (after x), total = 300 + 200 = 500
    expect(tl.estimatedDurationMs).toBe(500);
  });
});
