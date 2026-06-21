import type { BijouContext } from '../../ports/context.js';

import type { KeyInputMsg } from '../../ports/io.js';
export function isKey(
  msg: KeyInputMsg,
  key: string,
  mods: Partial<Pick<KeyInputMsg, 'ctrl' | 'alt' | 'shift'>> = {},
): boolean {
  if (msg.key !== key) return false;
  if (mods.ctrl !== undefined && msg.ctrl !== mods.ctrl) return false;
  if (mods.alt !== undefined && msg.alt !== mods.alt) return false;
  if (mods.shift !== undefined && msg.shift !== mods.shift) return false;
  return true;
}
export function handleVerticalNav(key: KeyInputMsg, cursor: number, length: number): number | null {
  if (isKey(key, 'up') || key.text === 'k') {
    return (cursor - 1 + length) % length;
  }
  if (isKey(key, 'down') || key.text === 'j') {
    return (cursor + 1) % length;
  }
  return null;
}
export function formDispatch<T>(
  ctx: BijouContext,
  interactive: (ctx: BijouContext) => Promise<T>,
  fallback: (ctx: BijouContext) => Promise<T>,
): Promise<T> {
  if (ctx.mode === 'interactive' && ctx.runtime.stdinIsTTY && ctx.runtime.stdoutIsTTY) {
    return interactive(ctx);
  }
  return fallback(ctx);
}
