import {
  createSpringState,
  createTweenState,
  resolveTweenConfig,
  springStep,
  tweenStep,
} from './spring.js';
import type {
  ResolvedTrack,
  TrackState,
} from './timeline-contract.js';
import { must } from './timeline-utils.js';

export function stepTimelineTrack(
  track: ResolvedTrack,
  previous: TrackState,
  elapsedMs: number,
  dt: number,
): TrackState {
  if (elapsedMs < track.startMs || previous.done) return previous;
  if (!previous.started) {
    const activeMs = Math.min(elapsedMs - track.startMs, dt * 1000);
    return startTrack(track, activeMs / 1000);
  }
  return continueTrack(track, previous, dt);
}

function startTrack(track: ResolvedTrack, dt: number): TrackState {
  if (track.trackType === 'spring') {
    const stepped = springStep(
      createSpringState(track.from),
      track.to,
      must(track.springConfig),
      dt,
    );
    return {
      type: 'spring',
      started: true,
      spring: stepped,
      currentValue: stepped.value,
      done: stepped.done,
    };
  }
  const stepped = tweenStep(
    createTweenState(track.from),
    tweenConfig(track),
    dt * 1000,
  );
  return {
    type: 'tween',
    started: true,
    tween: stepped,
    currentValue: stepped.value,
    done: stepped.done,
  };
}

function continueTrack(
  track: ResolvedTrack,
  previous: TrackState,
  dt: number,
): TrackState {
  if (track.trackType === 'spring') {
    const stepped = springStep(
      must(previous.spring),
      track.to,
      must(track.springConfig),
      dt,
    );
    return {
      ...previous,
      spring: stepped,
      currentValue: stepped.value,
      done: stepped.done,
    };
  }
  const stepped = tweenStep(
    must(previous.tween),
    tweenConfig(track),
    dt * 1000,
  );
  return {
    ...previous,
    tween: stepped,
    currentValue: stepped.value,
    done: stepped.done,
  };
}

function tweenConfig(track: ResolvedTrack) {
  return resolveTweenConfig({
    from: track.from,
    to: track.to,
    duration: must(track.tweenDuration),
    ease: track.tweenEase,
  });
}
