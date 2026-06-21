import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  it('empty timeline is immediately done', () => {
    const tl = timeline().build();
    const state = tl.init();
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state)).toEqual({});
  });
  it('callback-only timeline has no tracks', () => {
    const tl = timeline()
      .call('ping', 100)
      .build();
    const state = tl.init();
    expect(tl.done(state)).toBe(true);
    expect(tl.trackNames).toEqual([]);
  });
  it('<+= offset from previous start', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 400 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '<+=100')
      .build();
    // a starts at 0, b starts at 0 + 100 = 100ms
    // total: max(0+400, 100+200) = 400
    expect(tl.estimatedDurationMs).toBe(400);
  });
});
