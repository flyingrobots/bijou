import { describe, it, expect } from 'vitest';
import { timeline, type Timeline, type TimelineState } from './timeline.js';
import { EASINGS } from './spring.js';
import { must } from '@flyingrobots/bijou/adapters/test';

/** Helper: step a timeline N frames at 60fps and return final state. */
function runFrames(tl: Timeline, state: TimelineState, n: number): TimelineState {
  const dt = 1 / 60;
  for (let i = 0; i < n; i++) {
    state = tl.step(state, dt);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Position parameter
// ---------------------------------------------------------------------------
describe('position parameter', () => {
  it('sequential by default — second track starts after first', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200, ease: EASINGS.linear })
      .build();
    // At 200ms (12 frames), track a should be animating, track b should not
    const mid = runFrames(tl, tl.init(), 12);
    const midValues = tl.values(mid);
    expect(midValues.a).toBeGreaterThan(0);
    expect(midValues.b).toBe(0); // b hasn't started yet
  });
  it('"<" starts at same time as previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear }, '<')
      .build();
    // Total duration should be 300, not 600
    expect(tl.estimatedDurationMs).toBe(300);
    // Both should animate together
    const mid = runFrames(tl, tl.init(), 9); // 150ms
    const values = tl.values(mid);
    expect(values.a).toBeCloseTo(must(values.b), 2);
  });
  it('"+=N" adds gap after previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '+=100')
      .build();
    // b starts at 200 + 100 = 300ms
    expect(tl.estimatedDurationMs).toBe(500);
  });
  it('"-=N" overlaps with previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '-=100')
      .build();
    // b starts at 300 - 100 = 200ms, total = 200 + 200 = 400
    expect(tl.estimatedDurationMs).toBe(400);
  });
  it('absolute number positions at exact time', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 }, 1000)
      .build();
    // Track starts at 1000ms
    const before = runFrames(tl, tl.init(), 30); // 500ms
    expect(tl.values(before).a).toBe(0); // not started
    const after = runFrames(tl, before, 42); // +700ms = 1200ms total
    expect(tl.values(after).a).toBeGreaterThan(0); // animating
  });
});
