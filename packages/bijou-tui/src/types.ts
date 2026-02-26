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

// --- Commands ---

export const QUIT: unique symbol = Symbol('QUIT');
export type QuitSignal = typeof QUIT;

export type Cmd<M> = () => Promise<M | QuitSignal | void>;

// --- App definition ---

export interface App<Model, M = never> {
  init(): [Model, Cmd<M>[]];
  update(msg: KeyMsg | ResizeMsg | M, model: Model): [Model, Cmd<M>[]];
  view(model: Model): string;
}

// --- Runtime options ---

export interface RunOptions {
  altScreen?: boolean;
  hideCursor?: boolean;
  ctx?: BijouContext;
}
