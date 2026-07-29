import {
  createSpringState,
  springStep,
  type SpringConfig,
} from './spring.js';
import type { Position } from './timeline-contract.js';
import { must } from './timeline-utils.js';

export interface TimelineCursor {
  readonly prevStartMs: number;
  readonly prevEndMs: number;
  readonly labels: ReadonlyMap<string, number>;
}

export function estimateSpringDuration(
  from: number,
  to: number,
  config: SpringConfig,
): number {
  let state = createSpringState(from);
  const dt = 1 / 60;
  let steps = 0;
  const maxSteps = 60 * 30;
  while (!state.done && steps < maxSteps) {
    state = springStep(state, to, config, dt);
    steps += 1;
  }
  return steps * dt * 1000;
}

export function resolveTimelinePosition(
  position: Position | undefined,
  cursor: TimelineCursor,
): number {
  if (position === undefined) return cursor.prevEndMs;
  if (typeof position === 'number') return Math.max(0, position);
  if (position === '<') return cursor.prevStartMs;

  const fromPreviousStart = /^<\+=(\d+(?:\.\d+)?)$/.exec(position);
  if (fromPreviousStart !== null) {
    return cursor.prevStartMs + parseFloat(must(fromPreviousStart[1]));
  }
  const afterPreviousEnd = /^\+=(\d+(?:\.\d+)?)$/.exec(position);
  if (afterPreviousEnd !== null) {
    return cursor.prevEndMs + parseFloat(must(afterPreviousEnd[1]));
  }
  const beforePreviousEnd = /^-=(\d+(?:\.\d+)?)$/.exec(position);
  if (beforePreviousEnd !== null) {
    return Math.max(
      0,
      cursor.prevEndMs - parseFloat(must(beforePreviousEnd[1])),
    );
  }
  const fromPreviousEnd = /^>=?(\d+(?:\.\d+)?)$/.exec(position);
  if (fromPreviousEnd !== null) {
    return cursor.prevEndMs + parseFloat(must(fromPreviousEnd[1]));
  }
  const fromLabel =
    /^([a-zA-Z_]\w*)(?:\+=(\d+(?:\.\d+)?))?$/.exec(position);
  if (fromLabel !== null) {
    const label = must(fromLabel[1]);
    const offset = fromLabel[2] === undefined
      ? 0
      : parseFloat(fromLabel[2]);
    const labelMs = cursor.labels.get(label);
    if (labelMs === undefined) {
      throw new Error(`Timeline: unknown label "${label}"`);
    }
    return labelMs + offset;
  }
  throw new Error(`Timeline: invalid position "${position}"`);
}
