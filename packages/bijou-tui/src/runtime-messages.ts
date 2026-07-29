/** Represent a keyboard input event with key name and modifier flags. */
export interface KeyMsg {
  readonly type: 'key';
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
}

/** Represent a terminal resize event with new dimensions. */
export interface ResizeMsg {
  readonly type: 'resize';
  readonly columns: number;
  readonly rows: number;
}

/** Represent a system animation pulse event. */
export interface PulseMsg {
  readonly type: 'pulse';
  readonly dt: number;
}

export type MouseButton = 'left' | 'middle' | 'right' | 'none';
export type MouseAction =
  'press' | 'release' | 'move' | 'scroll-up' | 'scroll-down';
export type MouseTrackingMode = 'press' | 'drag' | 'any';

/** Mouse input event. */
export interface MouseMsg {
  readonly type: 'mouse';
  readonly button: MouseButton;
  readonly action: MouseAction;
  readonly col: number;
  readonly row: number;
  readonly shift: boolean;
  readonly alt: boolean;
  readonly ctrl: boolean;
}

export function isKeyMsg(msg: unknown): msg is KeyMsg {
  return messageType(msg) === 'key';
}

export function isResizeMsg(msg: unknown): msg is ResizeMsg {
  return messageType(msg) === 'resize';
}

export function isPulseMsg(msg: unknown): msg is PulseMsg {
  return messageType(msg) === 'pulse';
}

export function isMouseMsg(msg: unknown): msg is MouseMsg {
  return messageType(msg) === 'mouse';
}

function messageType(msg: unknown): unknown {
  if (typeof msg !== 'object' || msg === null || !('type' in msg)) {
    return undefined;
  }
  return msg.type;
}
