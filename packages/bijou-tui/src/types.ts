import type { BijouContext } from '@flyingrobots/bijou';

// --- Messages ---

export interface KeyMsg {
  readonly type: 'key';
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
}

export interface ResizeMsg {
  readonly type: 'resize';
  readonly columns: number;
  readonly rows: number;
}

// --- Mouse messages ---

export type MouseButton = 'left' | 'middle' | 'right' | 'none';
export type MouseAction = 'press' | 'release' | 'move' | 'scroll-up' | 'scroll-down';

export interface MouseMsg {
  readonly type: 'mouse';
  readonly button: MouseButton;
  readonly action: MouseAction;
  readonly col: number;   // 0-based
  readonly row: number;   // 0-based
  readonly shift: boolean;
  readonly alt: boolean;
  readonly ctrl: boolean;
}

// --- Type guards ---

/** Narrow an unknown message to KeyMsg. */
export function isKeyMsg(msg: unknown): msg is KeyMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as KeyMsg).type === 'key';
}

/** Narrow an unknown message to ResizeMsg. */
export function isResizeMsg(msg: unknown): msg is ResizeMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as ResizeMsg).type === 'resize';
}

/** Narrow an unknown message to MouseMsg. */
export function isMouseMsg(msg: unknown): msg is MouseMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as MouseMsg).type === 'mouse';
}

// --- Commands ---

export const QUIT: unique symbol = Symbol('QUIT');
export type QuitSignal = typeof QUIT;

/**
 * A side effect that can emit messages back to the application.
 * Returns a promise that resolves when the effect is complete.
 */
export type Cmd<M> = (emit: (msg: M) => void) => Promise<M | QuitSignal | void>;

// --- App definition ---

export interface App<Model, M = never> {
  init(): [Model, Cmd<M>[]];
  update(msg: KeyMsg | ResizeMsg | MouseMsg | M, model: Model): [Model, Cmd<M>[]];
  view(model: Model): string;
}

// --- Runtime options ---

export interface RunOptions {
  altScreen?: boolean;
  hideCursor?: boolean;
  /** Enable mouse input (SGR mode). Default: false. */
  mouse?: boolean;
  ctx?: BijouContext;
}
