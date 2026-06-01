import type { BijouContext } from '../../packages/bijou/src/index.js';

export const DOGFOOD_TERMINAL_NOTICE = [
  'Starting DOGFOOD, a full-screen interactive TUI.',
  'Exit controls: press q to open quit confirmation, y to confirm, n to cancel, or Ctrl-C to hard-exit.',
].join('\n') + '\n';

export const DOGFOOD_NON_INTERACTIVE_MESSAGE = [
  'DOGFOOD requires an interactive terminal with both stdin and stdout attached to a TTY.',
  'Run `npm run dogfood` in a terminal emulator, not through a shell pipeline, redirect, or non-interactive task runner.',
  'For scripted verification, use `npm run smoke:dogfood`.',
].join('\n') + '\n';

export function dogfoodTerminalReadiness(ctx: Pick<BijouContext, 'runtime'>): { ok: true } | { ok: false; message: string } {
  if (!ctx.runtime.stdoutIsTTY || !ctx.runtime.stdinIsTTY) {
    return { ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE };
  }
  return { ok: true };
}
