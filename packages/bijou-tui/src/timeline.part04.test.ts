import { describe, it, expect } from 'vitest';
import { timeline, type Timeline, type TimelineState } from './timeline.js';
import { must } from '@flyingrobots/bijou/adapters/test';

/** Helper: step until done or max frames, return state. */
function runUntilDone(tl: Timeline, maxFrames = 3600): TimelineState {
  let state = tl.init();
  const dt = 1 / 60;
  for (let i = 0; i < maxFrames; i++) {
    state = tl.step(state, dt);
    if (tl.done(state)) break;
  }
  return state;
}

// ---------------------------------------------------------------------------
// Stepping — spring tracks
// ---------------------------------------------------------------------------
describe('step (springs)', () => {
  it('animates a spring to the target', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'stiff' })
      .build();
    const state = runUntilDone(tl);
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state).x).toBe(100);
  });
  it('wobbly spring overshoots before settling', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'wobbly' })
      .build();
    let state = tl.init();
    let maxValue = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 3600; i++) {
      state = tl.step(state, dt);
      const v = must(tl.values(state).x);
      if (v > maxValue) maxValue = v;
      if (tl.done(state)) break;
    }
    expect(maxValue).toBeGreaterThan(100);
    expect(tl.values(state).x).toBe(100);
  });
});
