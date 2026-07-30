import { describe, expect, it } from 'vitest';
import type { ResolvedTrack, TrackState } from './timeline-contract.js';
import { stepTimelineTrack } from './timeline-track-step.js';

describe('timeline track activation delta', () => {
  it('advances only through the post-start portion of a crossing frame', () => {
    const track: ResolvedTrack = {
      name: 'opacity',
      startMs: 5,
      estimatedDurationMs: 100,
      trackType: 'tween',
      from: 0,
      to: 1,
      tweenDuration: 100,
      tweenEase: (progress) => progress,
    };
    const initial: TrackState = {
      type: 'tween',
      started: false,
      currentValue: 0,
      done: false,
    };

    const state = stepTimelineTrack(track, initial, 10, 0.01);

    expect(state.currentValue).toBeCloseTo(0.05);
  });
});
