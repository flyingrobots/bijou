import type { MouseTrackingMode, RunOptions } from './types.js';

export const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

const ENABLE_MOUSE_PRESS = '\x1b[?1000h\x1b[?1002l\x1b[?1003l\x1b[?1006h';
const ENABLE_MOUSE_DRAG = '\x1b[?1000h\x1b[?1002h\x1b[?1003l\x1b[?1006h';
const ENABLE_MOUSE_ANY = '\x1b[?1000h\x1b[?1002l\x1b[?1003h\x1b[?1006h';

export function resolveMouseMode<M>(
  options: RunOptions<M> | undefined,
): MouseTrackingMode | undefined {
  if (options?.mouseMode !== undefined) return options.mouseMode;
  return options?.mouse === true ? 'drag' : undefined;
}

export function mouseModeSequence(mode: MouseTrackingMode): string {
  if (mode === 'press') return ENABLE_MOUSE_PRESS;
  if (mode === 'any') return ENABLE_MOUSE_ANY;
  return ENABLE_MOUSE_DRAG;
}
