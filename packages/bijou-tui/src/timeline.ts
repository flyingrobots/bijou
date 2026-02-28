/**
 * GSAP-style Timeline — orchestrate multiple animations with position-based timing.
 *
 * The timeline is a **pure state machine**: build a timeline definition,
 * then step it forward in your TEA update function. No internal timers,
 * no mutation, fully testable.
 *
 * ```ts
 * const tl = timeline()
 *   .add('x',       { from: 0, to: 100, spring: 'wobbly' })
 *   .add('opacity', { type: 'tween', from: 0, to: 1, duration: 300 }, '<')
 *   .label('reveal')
 *   .add('y',       { from: 0, to: 50, spring: 'gentle' }, 'reveal')
 *   .call('onReveal', 'reveal+=100')
 *   .build();
 *
 * // TEA init:
 * const state = tl.init();
 *
 * // TEA update (on each animation frame):
 * const next = tl.step(state, 1/60);
 * const { x, opacity, y } = tl.values(next);
 * const fired = tl.firedCallbacks(state, next);
 * if (tl.done(next)) { ... }
 * ```
 */

import {
  type SpringConfig,
  type SpringPreset,
  type SpringState,
  type EasingFn,
  springStep,
  createSpringState,
  resolveSpringConfig,
  tweenStep,
  createTweenState,
  resolveTweenConfig,
  EASINGS,
  type TweenState,
} from './spring.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Position in the timeline — controls when a track/callback starts. */
export type Position =
  | number    // absolute time in ms
  | '<'       // same start as previous item
  | `<+=${string}`  // offset from previous start (ms)
  | `+=${string}`   // offset from previous end
  | `-=${string}`   // overlap: start before previous ends
  | `>${string}`    // explicit: offset from previous end
  | string;  // label name, or 'label+=offset'

/** Spring track configuration. */
export interface SpringTrackDef {
  /** Animation type (defaults to `'spring'` when omitted). */
  readonly type?: 'spring';
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Spring physics parameters or a named preset. */
  readonly spring?: Partial<SpringConfig> | SpringPreset;
}

/** Tween track configuration. */
export interface TweenTrackDef {
  /** Animation type — must be `'tween'`. */
  readonly type: 'tween';
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Duration in milliseconds. */
  readonly duration: number;
  /** Easing function (defaults to `easeOutCubic`). */
  readonly ease?: EasingFn;
}

/** Discriminated union of spring and tween track definitions. */
export type TrackDef = SpringTrackDef | TweenTrackDef;

/** Opaque timeline state — pass between step() calls. */
export interface TimelineState {
  /** Elapsed time in milliseconds. */
  readonly elapsedMs: number;
  /** Per-track animation state. */
  readonly tracks: Readonly<Record<string, TrackState>>;
}

/**
 * Per-track animation state stored inside `TimelineState`.
 * @internal
 */
interface TrackState {
  /** Animation engine type. */
  readonly type: 'spring' | 'tween';
  /** Whether the track has received its first step. */
  readonly started: boolean;
  /** Spring-specific simulation state (present when `type === 'spring'`). */
  readonly spring?: SpringState;
  /** Tween-specific simulation state (present when `type === 'tween'`). */
  readonly tween?: TweenState;
  /** Current interpolated value. */
  readonly currentValue: number;
  /** Whether the track has settled at its target. */
  readonly done: boolean;
}

// ---------------------------------------------------------------------------
// Internal: resolved track/callback/label
// ---------------------------------------------------------------------------

/**
 * Fully resolved track after position resolution and duration estimation.
 * @internal
 */
interface ResolvedTrack {
  /** Track identifier. */
  readonly name: string;
  /** Absolute start time in milliseconds. */
  readonly startMs: number;
  /** Estimated duration in milliseconds. */
  readonly estimatedDurationMs: number;
  /** Animation engine type. */
  readonly trackType: 'spring' | 'tween';
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Spring physics config (present when `trackType === 'spring'`). */
  readonly springConfig?: SpringConfig;
  /** Tween duration in ms (present when `trackType === 'tween'`). */
  readonly tweenDuration?: number;
  /** Tween easing function (present when `trackType === 'tween'`). */
  readonly tweenEase?: EasingFn;
}

/**
 * Callback trigger resolved to an absolute time.
 * @internal
 */
interface ResolvedCallback {
  /** Callback identifier. */
  readonly name: string;
  /** Absolute trigger time in milliseconds. */
  readonly atMs: number;
}

// ---------------------------------------------------------------------------
// Spring duration estimation
// ---------------------------------------------------------------------------

/**
 * Estimate how long a spring animation takes to settle by simulating it.
 *
 * @param from - Starting value.
 * @param to - Target value.
 * @param config - Spring physics configuration.
 * @returns Estimated duration in milliseconds (capped at 30 seconds).
 */
function estimateSpringDuration(
  from: number,
  to: number,
  config: SpringConfig,
): number {
  let state = createSpringState(from);
  const dt = 1 / 60;
  let steps = 0;
  const maxSteps = 60 * 30; // 30 seconds max
  while (!state.done && steps < maxSteps) {
    state = springStep(state, to, config, dt);
    steps++;
  }
  return steps * dt * 1000;
}

// ---------------------------------------------------------------------------
// Position parsing
// ---------------------------------------------------------------------------

/**
 * Tracks the cursor position while resolving timeline entry positions.
 * @internal
 */
interface CursorInfo {
  /** Start time of the previous track or callback in milliseconds. */
  prevStartMs: number;
  /** End time of the previous track or callback in milliseconds. */
  prevEndMs: number;
  /** Map of label names to their resolved times. */
  labels: ReadonlyMap<string, number>;
}

/**
 * Resolve a position specifier to an absolute time in milliseconds.
 *
 * @param pos - Position specifier (number, relative offset, or label reference).
 * @param cursor - Current cursor info with previous start/end and known labels.
 * @returns Absolute time in milliseconds.
 * @throws Error if the position references an unknown label or has invalid syntax.
 */
function resolvePosition(
  pos: Position | undefined,
  cursor: CursorInfo,
): number {
  if (pos === undefined) {
    // Default: after previous item ends
    return cursor.prevEndMs;
  }

  if (typeof pos === 'number') {
    return Math.max(0, pos);
  }

  if (pos === '<') {
    return cursor.prevStartMs;
  }

  // '<+=N' — offset from previous start
  const ltPlusMatch = /^<\+=(\d+(?:\.\d+)?)$/.exec(pos);
  if (ltPlusMatch) {
    return cursor.prevStartMs + parseFloat(ltPlusMatch[1]!);
  }

  // '+=N' — offset from previous end
  const plusMatch = /^\+=(\d+(?:\.\d+)?)$/.exec(pos);
  if (plusMatch) {
    return cursor.prevEndMs + parseFloat(plusMatch[1]!);
  }

  // '-=N' — overlap with previous
  const minusMatch = /^-=(\d+(?:\.\d+)?)$/.exec(pos);
  if (minusMatch) {
    return Math.max(0, cursor.prevEndMs - parseFloat(minusMatch[1]!));
  }

  // '>N' or '>=N' — explicit offset from previous end
  const gtMatch = /^>=?(\d+(?:\.\d+)?)$/.exec(pos);
  if (gtMatch) {
    return cursor.prevEndMs + parseFloat(gtMatch[1]!);
  }

  // 'label' or 'label+=N'
  const labelMatch = /^([a-zA-Z_]\w*)(?:\+=(\d+(?:\.\d+)?))?$/.exec(pos);
  if (labelMatch) {
    const labelName = labelMatch[1]!;
    const offset = labelMatch[2] ? parseFloat(labelMatch[2]) : 0;
    const labelMs = cursor.labels.get(labelName);
    if (labelMs === undefined) {
      throw new Error(`Timeline: unknown label "${labelName}"`);
    }
    return labelMs + offset;
  }

  throw new Error(`Timeline: invalid position "${pos}"`);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Discriminated union of entries accumulated by the timeline builder.
 * @internal
 */
type BuilderEntry =
  | { kind: 'track'; name: string; def: TrackDef; position?: Position }
  | { kind: 'label'; name: string }
  | { kind: 'call'; name: string; position?: Position };

/** Fluent builder for constructing a timeline definition. */
export interface TimelineBuilder {
  /**
   * Add an animation track.
   *
   * ```ts
   * .add('x', { from: 0, to: 100, spring: 'wobbly' })
   * .add('opacity', { type: 'tween', from: 0, to: 1, duration: 300 }, '<')
   * ```
   *
   * @param name - Unique track identifier used to read values later.
   * @param def - Spring or tween track definition.
   * @param position - When the track starts (default: after previous item ends).
   * @returns The builder for chaining.
   * @throws Error (at build time) if a duplicate track name is added.
   */
  add(name: string, def: TrackDef, position?: Position): TimelineBuilder;

  /**
   * Add a named label at the current position (end of previous item).
   *
   * ```ts
   * .label('reveal')
   * .add('scale', { type: 'tween', from: 0, to: 1, duration: 200 }, 'reveal')
   * ```
   *
   * @param name - Label identifier, referenced by later position specifiers.
   * @returns The builder for chaining.
   */
  label(name: string): TimelineBuilder;

  /**
   * Add a named callback trigger at a position.
   *
   * ```ts
   * .call('onHalfway', '+=500')
   * ```
   *
   * @param name - Callback identifier returned by `firedCallbacks()`.
   * @param position - When the callback fires (default: after previous item ends).
   * @returns The builder for chaining.
   */
  call(name: string, position?: Position): TimelineBuilder;

  /**
   * Compile the timeline into an immutable Timeline object.
   *
   * @returns Compiled {@link Timeline} ready for stepping.
   * @throws Error if a position references an unknown label or has invalid syntax.
   */
  build(): Timeline;
}

/** Compiled timeline — step forward, read values, check completion. */
export interface Timeline {
  /**
   * Create the initial timeline state.
   *
   * @returns Fresh timeline state with all tracks at their starting values.
   */
  init(): TimelineState;

  /**
   * Advance the timeline by `dt` seconds.
   * Returns a new state (pure — no mutation).
   *
   * @param state - Current timeline state.
   * @param dt - Time step in seconds (e.g. 1/60 for 60 fps). Must be finite and non-negative.
   * @returns Updated timeline state with all active tracks advanced.
   * @throws Error if `dt` is negative, `NaN`, or infinite.
   */
  step(state: TimelineState, dt: number): TimelineState;

  /**
   * Read all current track values as a name-to-number record.
   *
   * @param state - Current timeline state.
   * @returns Record mapping each track name to its current value.
   */
  values(state: TimelineState): Record<string, number>;

  /**
   * True when every track has settled.
   *
   * @param state - Current timeline state.
   * @returns Whether all tracks have reached their target values.
   */
  done(state: TimelineState): boolean;

  /**
   * Return callback names that fired between `prev` and `next` states.
   * A callback fires when the timeline's elapsed time crosses its trigger point.
   *
   * @param prev - Timeline state before the step.
   * @param next - Timeline state after the step.
   * @returns Array of callback names that fired during the interval.
   */
  firedCallbacks(prev: TimelineState, next: TimelineState): string[];

  /** Total estimated duration in milliseconds. */
  readonly estimatedDurationMs: number;

  /** All track names in the timeline. */
  readonly trackNames: readonly string[];
}

// ---------------------------------------------------------------------------
// timeline() — entry point
// ---------------------------------------------------------------------------

/**
 * Create a new timeline builder.
 *
 * ```ts
 * const tl = timeline()
 *   .add('x', { from: 0, to: 100, spring: 'wobbly' })
 *   .add('opacity', { type: 'tween', from: 0, to: 1, duration: 300 }, '<')
 *   .build();
 * ```
 *
 * @returns A new {@link TimelineBuilder} for fluent timeline construction.
 */
export function timeline(): TimelineBuilder {
  const entries: BuilderEntry[] = [];

  const builder: TimelineBuilder = {
    add(name, def, position) {
      entries.push({ kind: 'track', name, def, position });
      return builder;
    },
    label(name) {
      entries.push({ kind: 'label', name });
      return builder;
    },
    call(name, position) {
      entries.push({ kind: 'call', name, position });
      return builder;
    },
    build() {
      return compile(entries);
    },
  };

  return builder;
}

// ---------------------------------------------------------------------------
// Compilation: resolve positions, estimate durations
// ---------------------------------------------------------------------------

/**
 * Compile builder entries into an immutable Timeline object.
 *
 * Resolves all positions, estimates durations, and sorts callbacks.
 *
 * @param entries - Accumulated builder entries (tracks, labels, callbacks).
 * @returns Compiled Timeline with init, step, values, done, and firedCallbacks.
 * @throws Error if a position references an unknown label or has invalid syntax.
 */
function compile(entries: BuilderEntry[]): Timeline {
  const tracks: ResolvedTrack[] = [];
  const callbacks: ResolvedCallback[] = [];
  const labels = new Map<string, number>();

  let prevStartMs = 0;
  let prevEndMs = 0;

  for (const entry of entries) {
    const cursor: CursorInfo = { prevStartMs, prevEndMs, labels };

    switch (entry.kind) {
      case 'label': {
        labels.set(entry.name, prevEndMs);
        break;
      }

      case 'call': {
        const atMs = resolvePosition(entry.position, cursor);
        callbacks.push({ name: entry.name, atMs });
        // Callbacks don't move the cursor
        break;
      }

      case 'track': {
        const startMs = resolvePosition(entry.position, cursor);
        const { def } = entry;

        let resolved: ResolvedTrack;
        if (def.type === 'tween') {
          resolved = {
            name: entry.name,
            startMs,
            estimatedDurationMs: def.duration,
            trackType: 'tween',
            from: def.from,
            to: def.to,
            tweenDuration: def.duration,
            tweenEase: def.ease ?? EASINGS.easeOutCubic,
          };
        } else {
          const springConfig = resolveSpringConfig(def.spring);
          const estDuration = estimateSpringDuration(def.from, def.to, springConfig);
          resolved = {
            name: entry.name,
            startMs,
            estimatedDurationMs: estDuration,
            trackType: 'spring',
            from: def.from,
            to: def.to,
            springConfig,
          };
        }

        if (tracks.some(t => t.name === entry.name)) {
          throw new Error(`Timeline: duplicate track name "${entry.name}"`);
        }

        tracks.push(resolved);
        prevStartMs = startMs;
        prevEndMs = startMs + resolved.estimatedDurationMs;
        break;
      }
    }
  }

  // Sort callbacks by time for efficient checking
  const sortedCallbacks = [...callbacks].sort((a, b) => a.atMs - b.atMs);
  const trackNames = tracks.map((t) => t.name);

  const estimatedDurationMs = tracks.reduce(
    (max, t) => Math.max(max, t.startMs + t.estimatedDurationMs),
    0,
  );

  return {
    estimatedDurationMs,
    trackNames,

    init(): TimelineState {
      const trackStates: Record<string, TrackState> = {};
      for (const t of tracks) {
        trackStates[t.name] = {
          type: t.trackType,
          started: false,
          currentValue: t.from,
          done: false,
        };
      }
      return { elapsedMs: 0, tracks: trackStates };
    },

    step(state: TimelineState, dt: number): TimelineState {
      if (!Number.isFinite(dt) || dt < 0) {
        throw new Error(`Timeline: dt must be a finite non-negative number, got ${dt}`);
      }
      const dtMs = dt * 1000;
      const elapsedMs = state.elapsedMs + dtMs;
      const nextTracks: Record<string, TrackState> = {};

      for (const t of tracks) {
        const prev = state.tracks[t.name]!;

        // Not started yet
        if (elapsedMs < t.startMs) {
          nextTracks[t.name] = prev;
          continue;
        }

        // Already done
        if (prev.done) {
          nextTracks[t.name] = prev;
          continue;
        }

        // First frame — initialize animation state
        if (!prev.started) {
          if (t.trackType === 'spring') {
            const spring = createSpringState(t.from);
            const stepped = springStep(spring, t.to, t.springConfig!, dt);
            nextTracks[t.name] = {
              type: 'spring',
              started: true,
              spring: stepped,
              currentValue: stepped.value,
              done: stepped.done,
            };
          } else {
            const tween = createTweenState(t.from);
            const config = resolveTweenConfig({
              from: t.from,
              to: t.to,
              duration: t.tweenDuration!,
              ease: t.tweenEase,
            });
            const stepped = tweenStep(tween, config, dtMs);
            nextTracks[t.name] = {
              type: 'tween',
              started: true,
              tween: stepped,
              currentValue: stepped.value,
              done: stepped.done,
            };
          }
          continue;
        }

        // Ongoing — step the animation
        if (t.trackType === 'spring') {
          const stepped = springStep(prev.spring!, t.to, t.springConfig!, dt);
          nextTracks[t.name] = {
            ...prev,
            spring: stepped,
            currentValue: stepped.value,
            done: stepped.done,
          };
        } else {
          const config = resolveTweenConfig({
            from: t.from,
            to: t.to,
            duration: t.tweenDuration!,
            ease: t.tweenEase,
          });
          const stepped = tweenStep(prev.tween!, config, dtMs);
          nextTracks[t.name] = {
            ...prev,
            tween: stepped,
            currentValue: stepped.value,
            done: stepped.done,
          };
        }
      }

      return { elapsedMs, tracks: nextTracks };
    },

    values(state: TimelineState): Record<string, number> {
      const result: Record<string, number> = {};
      for (const name of trackNames) {
        result[name] = state.tracks[name]!.currentValue;
      }
      return result;
    },

    done(state: TimelineState): boolean {
      return trackNames.every((name) => state.tracks[name]!.done);
    },

    firedCallbacks(prev: TimelineState, next: TimelineState): string[] {
      const fired: string[] = [];
      for (const cb of sortedCallbacks) {
        // A callback fires when elapsed crosses its trigger point.
        // For callbacks at time 0, fire on the first step (prev=0, next>0).
        const prevBefore = cb.atMs === 0 ? prev.elapsedMs === 0 && next.elapsedMs > 0
          : prev.elapsedMs < cb.atMs && next.elapsedMs >= cb.atMs;
        if (prevBefore) {
          fired.push(cb.name);
        }
      }
      return fired;
    },
  };
}
