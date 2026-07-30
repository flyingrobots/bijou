import type {
  EasingFn,
  SpringConfig,
  SpringPreset,
  SpringState,
  TweenState,
} from './spring.js';

/** Position in the timeline controlling when an entry starts. */
export type Position =
  number
  | '<'
  | `<+=${string}`
  | `+=${string}`
  | `-=${string}`
  | `>${string}`
  | (string & {});

/** Spring track configuration. */
export interface SpringTrackDef {
  /** Animation type; omitted values select spring behavior. */
  readonly type?: 'spring';
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Spring physics parameters or named preset. */
  readonly spring?: Partial<SpringConfig> | SpringPreset;
}

/** Tween track configuration. */
export interface TweenTrackDef {
  /** Animation type. */
  readonly type: 'tween';
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Duration in milliseconds. */
  readonly duration: number;
  /** Easing function; defaults to `easeOutCubic`. */
  readonly ease?: EasingFn;
}

/** Discriminated union of supported track definitions. */
export type TrackDef = SpringTrackDef | TweenTrackDef;

/** Opaque immutable state passed between timeline steps. */
export interface TimelineState {
  /** Elapsed timeline time in milliseconds. */
  readonly elapsedMs: number;
  /** Per-track engine state. */
  readonly tracks: Readonly<Record<string, TrackState>>;
}

/** Fluent builder for position-based tracks, labels, and callbacks. */
export interface TimelineBuilder {
  /** Add a uniquely named animation track. */
  add(name: string, def: TrackDef, position?: Position): TimelineBuilder;
  /** Add a label at the current timeline cursor. */
  label(name: string): TimelineBuilder;
  /** Add a named callback trigger. */
  call(name: string, position?: Position): TimelineBuilder;
  /** Compile the accumulated definition into an immutable state machine. */
  build(): Timeline;
}

/** Compiled timeline state machine. */
export interface Timeline {
  /** Create an initial state with every track at its starting value. */
  init(): TimelineState;
  /** Advance state by a finite, non-negative duration in seconds. */
  step(state: TimelineState, dt: number): TimelineState;
  /** Read current values keyed by track name. */
  values(state: TimelineState): Record<string, number>;
  /** Report whether every track has settled. */
  done(state: TimelineState): boolean;
  /** Return callbacks crossed between two states. */
  firedCallbacks(prev: TimelineState, next: TimelineState): string[];
  /** Estimated total duration in milliseconds. */
  readonly estimatedDurationMs: number;
  /** Track names in definition order. */
  readonly trackNames: readonly string[];
}

/** Internal per-track engine state retained by `TimelineState`. */
export interface TrackState {
  readonly type: 'spring' | 'tween';
  readonly started: boolean;
  readonly spring?: SpringState;
  readonly tween?: TweenState;
  readonly currentValue: number;
  readonly done: boolean;
}

export interface ResolvedTrack {
  readonly name: string;
  readonly startMs: number;
  readonly estimatedDurationMs: number;
  readonly trackType: 'spring' | 'tween';
  readonly from: number;
  readonly to: number;
  readonly springConfig?: SpringConfig;
  readonly tweenDuration?: number;
  readonly tweenEase?: EasingFn;
}

export interface ResolvedCallback {
  readonly name: string;
  readonly atMs: number;
}

export type BuilderEntry =
  | {
    readonly kind: 'track';
    readonly name: string;
    readonly def: TrackDef;
    readonly position?: Position;
  }
  | { readonly kind: 'label'; readonly name: string }
  | {
    readonly kind: 'call';
    readonly name: string;
    readonly position?: Position;
  };
