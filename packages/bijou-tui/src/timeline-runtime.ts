import type {
  ResolvedCallback,
  ResolvedTrack,
  Timeline,
  TimelineState,
  TrackState,
} from './timeline-contract.js';
import { stepTimelineTrack } from './timeline-track-step.js';
import { must } from './timeline-utils.js';

export function createTimelineRuntime(
  tracks: readonly ResolvedTrack[],
  callbacks: readonly ResolvedCallback[],
): Timeline {
  const trackNames = tracks.map((track) => track.name);
  return {
    trackNames,
    estimatedDurationMs: tracks.reduce(
      (maximum, track) => Math.max(
        maximum,
        track.startMs + track.estimatedDurationMs,
      ),
      0,
    ),
    init() {
      return initialTimelineState(tracks);
    },
    step(state, dt) {
      return stepTimelineState(tracks, state, dt);
    },
    values(state) {
      return timelineValues(trackNames, state);
    },
    done(state) {
      return trackNames.every(
        (name) => must(state.tracks[name], `track "${name}" state`).done,
      );
    },
    firedCallbacks(previous, next) {
      return firedTimelineCallbacks(callbacks, previous, next);
    },
  };
}

function initialTimelineState(
  tracks: readonly ResolvedTrack[],
): TimelineState {
  const states: Record<string, TrackState> = {};
  for (const track of tracks) {
    states[track.name] = {
      type: track.trackType,
      started: false,
      currentValue: track.from,
      done: false,
    };
  }
  return { elapsedMs: 0, tracks: states };
}

function stepTimelineState(
  tracks: readonly ResolvedTrack[],
  state: TimelineState,
  dt: number,
): TimelineState {
  if (!Number.isFinite(dt) || dt < 0) {
    throw new Error(
      `Timeline: dt must be a finite non-negative number, got ${String(dt)}`,
    );
  }
  const elapsedMs = state.elapsedMs + dt * 1000;
  const states: Record<string, TrackState> = {};
  for (const track of tracks) {
    states[track.name] = stepTimelineTrack(
      track,
      must(state.tracks[track.name], `track "${track.name}" state`),
      elapsedMs,
      dt,
    );
  }
  return { elapsedMs, tracks: states };
}

function timelineValues(
  trackNames: readonly string[],
  state: TimelineState,
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const name of trackNames) {
    values[name] = must(
      state.tracks[name],
      `track "${name}" state`,
    ).currentValue;
  }
  return values;
}

function firedTimelineCallbacks(
  callbacks: readonly ResolvedCallback[],
  previous: TimelineState,
  next: TimelineState,
): string[] {
  return callbacks
    .filter((callback) => callback.atMs === 0
      ? previous.elapsedMs === 0 && next.elapsedMs > 0
      : previous.elapsedMs < callback.atMs
        && next.elapsedMs >= callback.atMs)
    .map((callback) => callback.name);
}
