import {
  EASINGS,
  resolveSpringConfig,
} from './spring.js';
import type {
  BuilderEntry,
  ResolvedCallback,
  ResolvedTrack,
  Timeline,
  TrackDef,
} from './timeline-contract.js';
import {
  estimateSpringDuration,
  resolveTimelinePosition,
  type TimelineCursor,
} from './timeline-position.js';
import { createTimelineRuntime } from './timeline-runtime.js';

export function compileTimeline(entries: readonly BuilderEntry[]): Timeline {
  const tracks: ResolvedTrack[] = [];
  const trackNames = new Set<string>();
  const callbacks: ResolvedCallback[] = [];
  const labels = new Map<string, number>();
  let prevStartMs = 0;
  let prevEndMs = 0;

  for (const entry of entries) {
    const cursor: TimelineCursor = { prevStartMs, prevEndMs, labels };
    if (entry.kind === 'label') {
      labels.set(entry.name, prevEndMs);
      continue;
    }
    if (entry.kind === 'call') {
      callbacks.push({
        name: entry.name,
        atMs: resolveTimelinePosition(entry.position, cursor),
      });
      continue;
    }
    const startMs = resolveTimelinePosition(entry.position, cursor);
    if (trackNames.has(entry.name)) {
      throw new Error(`Timeline: duplicate track name "${entry.name}"`);
    }
    const resolved = resolveTrack(entry.name, entry.def, startMs);
    trackNames.add(entry.name);
    tracks.push(resolved);
    prevStartMs = startMs;
    prevEndMs = startMs + resolved.estimatedDurationMs;
  }
  return createTimelineRuntime(
    tracks,
    [...callbacks].sort((left, right) => left.atMs - right.atMs),
  );
}

function resolveTrack(
  name: string,
  definition: TrackDef,
  startMs: number,
): ResolvedTrack {
  if (definition.type === 'tween') {
    return {
      name,
      startMs,
      estimatedDurationMs: definition.duration,
      trackType: 'tween',
      from: definition.from,
      to: definition.to,
      tweenDuration: definition.duration,
      tweenEase: definition.ease ?? EASINGS.easeOutCubic,
    };
  }
  const springConfig = resolveSpringConfig(definition.spring);
  return {
    name,
    startMs,
    estimatedDurationMs: estimateSpringDuration(
      definition.from,
      definition.to,
      springConfig,
    ),
    trackType: 'spring',
    from: definition.from,
    to: definition.to,
    springConfig,
  };
}
