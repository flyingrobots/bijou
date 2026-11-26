/**
 * `bijou-replay-event/1` envelope types (DL-033).
 *
 * The outbox validates the envelope and that every payload value is plain
 * JSON data. Payload shapes per `kind` are the emitter's contract; the JSON
 * Schema in `schemas/bijou-replay-event.v1.schema.json` describes them.
 */

/** The format and major version written on every line. */
export const REPLAY_EVENT_SCHEMA = 'bijou-replay-event/1';

/** Every `kind` that a v1 writer may append. */
export const REPLAY_EVENT_KINDS = [
  'session',
  'input',
  'resize',
  'pulse',
  'command',
  'debug-fact',
  'frame',
  'end',
] as const;

export type ReplayEventKind = (typeof REPLAY_EVENT_KINDS)[number];

/** Who delivered a message: a script step, a command, or a bus timer. */
export type ReplayMessageOrigin = 'script' | 'command' | 'timer';

export interface ReplaySessionPayload {
  readonly source: 'script' | 'test' | 'dogfood';
  readonly label: string;
  readonly claim: 'frame-playback';
  readonly viewport: { readonly columns: number; readonly rows: number };
  readonly context: {
    readonly mode: 'interactive' | 'static' | 'pipe' | 'accessible';
    readonly theme: string | null;
    readonly colorLevel: string | number | null;
  };
  readonly clock: 'mock' | 'system';
  readonly pulses: 'script' | { readonly timerFps: number };
}

interface ReplayDelivery {
  readonly origin: ReplayMessageOrigin;
  /** Present exactly when `origin` is `'command'`. */
  readonly cmd?: number;
}

export interface ReplayInputPayload extends ReplayDelivery {
  /** The delivered message as plain data. Validated at append time. */
  readonly msg: unknown;
}

export interface ReplayResizePayload extends ReplayDelivery {
  readonly columns: number;
  readonly rows: number;
}

export interface ReplayPulsePayload extends ReplayDelivery {
  /** Seconds, exactly as delivered. */
  readonly dt: number;
}

export interface ReplayCommandPayload {
  readonly cmd: number;
  readonly phase: 'start' | 'settle';
  readonly outcome?: 'message' | 'quit' | 'cleanup' | 'empty' | 'error';
}

export interface ReplayDebugFactPayload {
  readonly name: string;
  /** Any plain JSON value. Validated at append time. */
  readonly value: unknown;
}

/** One entry of a frame's style table. Default-valued keys are left out. */
export interface ReplayFrameStyle {
  readonly fg?: readonly [number, number, number];
  readonly bg?: readonly [number, number, number];
  readonly modifiers?: readonly string[];
  readonly empty?: boolean;
  readonly opacity?: number;
}

/** A frame's hashed content: row-major `[char, styleIndex]` cells. */
export interface ReplayFrameContent {
  readonly width: number;
  readonly height: number;
  readonly styles: readonly ReplayFrameStyle[];
  readonly cells: readonly (readonly [string, number])[];
}

export interface ReplayFramePayload extends ReplayFrameContent {
  readonly index: number;
  /** `sha256:<hex>` from `surfaceFrameHash()`. */
  readonly hash: string;
}

export interface ReplayEndPayload {
  readonly frames: number;
  readonly pendingCommands: number;
  readonly reason: 'steps-complete' | 'quit' | 'error';
}

export interface ReplayPayloadByKind {
  readonly session: ReplaySessionPayload;
  readonly input: ReplayInputPayload;
  readonly resize: ReplayResizePayload;
  readonly pulse: ReplayPulsePayload;
  readonly command: ReplayCommandPayload;
  readonly 'debug-fact': ReplayDebugFactPayload;
  readonly frame: ReplayFramePayload;
  readonly end: ReplayEndPayload;
}

/** What an emitter hands to `append()`: the outbox adds `schema` and `seq`. */
export type ReplayEventInput = {
  readonly [K in ReplayEventKind]: {
    readonly tick: number;
    readonly atMs: number;
    readonly kind: K;
    readonly payload: ReplayPayloadByKind[K];
  };
}[ReplayEventKind];

/** One recorded line, as `events()` returns it after a JSON round trip. */
export interface ReplayEvent {
  readonly schema: typeof REPLAY_EVENT_SCHEMA;
  readonly seq: number;
  readonly tick: number;
  readonly atMs: number;
  readonly kind: ReplayEventKind;
  readonly payload: Readonly<Record<string, unknown>>;
}
