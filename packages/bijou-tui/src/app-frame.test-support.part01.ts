import { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';

import { stringToSurface } from '@flyingrobots/bijou';

import type { BijouContext } from '@flyingrobots/bijou';

import type { Cmd } from './types.js';
export type Msg =
  | { type: 'inc' }
  | { type: 'noop' }
  | { type: 'toggle-hints' }
  | { type: 'toggle-modal' }
  | { type: 'close-modal' };
export interface PageModel {
  count: number;
  showHints?: boolean;
  modalOpen?: boolean;
}
export const KEY_TAB = '\t';
export const KEY_SHIFT_TAB = '\x1b[Z';
export const KEY_ESCAPE = '\x1b';
export const KEY_CTRL_P = '\x10';
export const KEY_ENTER = '\r';
export const KEY_DOWN = '\x1b[B';
export const KEY_BACKTICK = '`';
export const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';
export function ctrlKey(key: string) {
  return { type: 'key' as const, key, ctrl: true, alt: false, shift: false };
}
export function shiftKey(key: string) {
  return { type: 'key' as const, key, ctrl: false, alt: false, shift: true };
}
export function makeLongContent(label: string, lines = 40): string {
  return Array.from({ length: lines }, (_, i) => `${label} line ${String(i)}`).join('\n');
}
export function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}
export function createInteractiveContext(options: Parameters<typeof createTestContext>[0] = {}) {
  const clock = mockClock();
  const ctx = createTestContext({ ...options, mode: 'interactive', clock });
  return { clock, ctx };
}
export async function collectCommandMessages<M>(cmd: Cmd<M>, pulses: readonly number[]): Promise<M[]> {
  const msgs: M[] = [];
  const hooks = new Set<(dt: number) => void>();
  const state = { done: false };
  const run = Promise.resolve(cmd((msg) => msgs.push(msg), {
    onPulse(handler) {
      hooks.add(handler);
      return {
        dispose() {
          hooks.delete(handler);
        },
      };
    },
  })).finally(() => {
    state.done = true;
  });

  for (const dt of pulses) {
    if (state.done) break;
    for (const handler of [...hooks]) {
      handler(dt);
    }
    await Promise.resolve();
  }

  if (!state.done) throw new Error(`stuck ${String(pulses.length)} pulse`);
  await run;
  return msgs;
}
export function scheduleKeys(
  ctx: ReturnType<typeof createTestContext>,
  clock: ReturnType<typeof mockClock>,
  events: { at: number; key: string }[],
): void {
  ctx.io.rawInput = (onKey) => {
    const handles = events.map(({ at, key }) => clock.setTimeout(() => { onKey(key); }, at));
    return {
      dispose() {
        handles.forEach((handle) => {
          handle.dispose();
        });
      },
    };
  };
}
export function createAlternateShellTheme(ctx: BijouContext) {
  const baseTheme = ctx.theme.theme;
  return {
    ...baseTheme,
    name: 'alternate-shell',
    semantic: {
      ...baseTheme.semantic,
      muted: {
        ...baseTheme.semantic.muted,
        hex: '#7dd3fc',
      },
    },
    border: {
      ...baseTheme.border,
      primary: {
        ...baseTheme.border.primary,
        hex: '#ff66cc',
      },
    },
    surface: {
      ...baseTheme.surface,
      elevated: {
        ...baseTheme.surface.elevated,
        hex: '#e8f6ff',
        bg: '#18324a',
      },
    },
  };
}
export function createSameNameAlternateShellTheme(ctx: BijouContext) {
  return {
    ...createAlternateShellTheme(ctx),
    name: ctx.theme.theme.name,
  };
}
