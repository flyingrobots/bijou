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
  readonly type?: 'spring';
  readonly from: number;
  readonly to: number;
  readonly spring?: Partial<SpringConfig> | SpringPreset;
}

/** Tween track configuration. */
export interface TweenTrackDef {
  readonly type: 'tween';
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly ease?: EasingFn;
}

export type TrackDef = SpringTrackDef | TweenTrackDef;

/** Opaque immutable state passed between timeline steps. */
export interface TimelineState {
  readonly elapsedMs: number;
  readonly tracks: Readonly<Record<string, TrackState>>;
}

export interface TimelineBuilder {
  add(name: string, def: TrackDef, position?: Position): TimelineBuilder;
  label(name: string): TimelineBuilder;
  call(name: string, position?: Position): TimelineBuilder;
  build(): Timeline;
}

/** Compiled timeline state machine. */
export interface Timeline {
  init(): TimelineState;
  step(state: TimelineState, dt: number): TimelineState;
  values(state: TimelineState): Record<string, number>;
  done(state: TimelineState): boolean;
  firedCallbacks(prev: TimelineState, next: TimelineState): string[];
  readonly estimatedDurationMs: number;
  readonly trackNames: readonly string[];
}

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
