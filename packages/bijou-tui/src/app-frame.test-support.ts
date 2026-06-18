import { describe, it, expect, expectTypeOf, beforeAll, afterAll } from 'vitest';
import { createTestContext, mockClock, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import {
  colorHex,
  createSurface,
  getDefaultContext,
  setDefaultContext,
  stringToSurface,
  surfaceToString,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';
import { createKeyMap } from './keybindings.js';
import { createSplitPaneState } from './split-pane.js';
import { mouseMove, mousePress, mouseRelease, runScript } from './driver.js';
import { normalizeViewOutput } from './view-output.js';
import { FRAME_I18N_CATALOG } from './app-frame-i18n.js';
import {
  createNotificationState,
  dismissNotification,
  hitTestNotificationStack,
  pushNotification,
  tickNotifications,
  type NotificationHistoryFilter,
  type NotificationState,
} from './notification.js';
import {
  activeFrameLayer,
  createFramedApp,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  notify,
  projectFrameControls,
  runFramedApp,
  type FramePage,
  type FramePageMsg,
  type FramedApp,
  type FramedAppMsg,
  type FramedAppUpdateResult,
  type FrameOverlayContext,
  type PageTransition,
  underlyingFrameLayer,
  wrapFrameMsg,
} from './app-frame.js';
import { activeRuntimeView } from './runtime-engine.js';
import { QUIT, isCmdCleanup, type Cmd, type MouseMsg } from './types.js';
import { tick } from './commands.js';

type Msg =
  | { type: 'inc' }
  | { type: 'noop' }
  | { type: 'toggle-hints' }
  | { type: 'toggle-modal' }
  | { type: 'close-modal' };

interface PageModel {
  count: number;
  showHints?: boolean;
  modalOpen?: boolean;
}

const KEY_TAB = '\t';
const KEY_SHIFT_TAB = '\x1b[Z';
const KEY_ESCAPE = '\x1b';
const KEY_CTRL_P = '\x10';
const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';
const KEY_BACKTICK = '`';
const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';

function ctrlKey(key: string) {
  return { type: 'key' as const, key, ctrl: true, alt: false, shift: false };
}

function shiftKey(key: string) {
  return { type: 'key' as const, key, ctrl: false, alt: false, shift: true };
}

function makeLongContent(label: string, lines = 40): string {
  return Array.from({ length: lines }, (_, i) => `${label} line ${i}`).join('\n');
}

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

function createInteractiveContext(options: Parameters<typeof createTestContext>[0] = {}) {
  const clock = mockClock();
  const ctx = createTestContext({ ...options, mode: 'interactive', clock });
  return { clock, ctx };
}

async function collectCommandMessages<M>(cmd: Cmd<M>, pulses: readonly number[]): Promise<M[]> {
  const msgs: M[] = [];
  const hooks = new Set<(dt: number) => void>();
  let done = false;
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
    done = true;
  });

  for (const dt of pulses) {
    if (done) break;
    for (const handler of [...hooks]) {
      handler(dt);
    }
    await Promise.resolve();
  }

  if (!done) throw new Error(`stuck ${String(pulses.length)} pulse`);
  await run;
  return msgs;
}

function scheduleKeys(
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

function createAlternateShellTheme(ctx: BijouContext) {
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

function createSameNameAlternateShellTheme(ctx: BijouContext) {
  return {
    ...createAlternateShellTheme(ctx),
    name: ctx.theme.theme.name,
  };
}

function surfaceHasFg(surface: Surface, fg: string): boolean {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      if (colorHex(surface.get(x, y).fg) === fg) return true;
    }
  }
  return false;
}

function surfaceHasBg(surface: Surface, bg: string): boolean {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      if (colorHex(surface.get(x, y).bg) === bg) return true;
    }
  }
  return false;
}

function seedNotificationHistory<Msg>(
  specs: readonly {
    readonly title: string;
    readonly message?: string;
    readonly tone?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    readonly variant?: 'TOAST' | 'INLINE' | 'ACTIONABLE';
  }[],
): NotificationState<Msg> {
  let state = createNotificationState<Msg>();
  let nowMs = 0;

  for (const spec of specs) {
    state = pushNotification(state, {
      title: spec.title,
      message: spec.message ?? `${spec.title} message`,
      tone: spec.tone ?? 'INFO',
      variant: spec.variant ?? 'TOAST',
      durationMs: null,
    }, nowMs);
    const id = state.items.at(-1)!.id;
    nowMs += 20;
    state = dismissNotification(state, id, nowMs);
    nowMs += 500;
    state = tickNotifications(state, nowMs);
  }

  return state;
}

function makePage(id: string, title: string, paneId: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ count: 0 }, []],
    update(msg, model) {
      if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId,
      render: () => textView(makeLongContent(`${id}:${paneId}`)),
    }),
    keyMap: createKeyMap<Msg>()
      .bind('x', 'Increment', { type: 'inc' }),
  };
}

function makeModalPage(id: string, title: string, paneId: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ count: 0, modalOpen: false }, []],
    update(msg, model) {
      if (msg.type === 'toggle-modal') return [{ ...model, modalOpen: !model.modalOpen }, []];
      if (msg.type === 'close-modal') return [{ ...model, modalOpen: false }, []];
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId,
      render: () => textView(makeLongContent(`${id}:${paneId}`)),
    }),
    keyMap: createKeyMap<Msg>()
      .bind('m', 'Toggle modal', { type: 'toggle-modal' })
      .bind('x', 'Increment', { type: 'inc' }),
    modalKeyMap: (model) => model.modalOpen
      ? createKeyMap<Msg>().bind('escape', 'Close modal', { type: 'close-modal' })
      : undefined,
  };
}

export {
  activeFrameLayer,
  activeRuntimeView,
  afterAll,
  beforeAll,
  collectCommandMessages,
  createAlternateShellTheme,
  createFramedApp,
  createI18nRuntime,
  createInteractiveContext,
  createKeyMap,
  createNotificationState,
  createSameNameAlternateShellTheme,
  createSplitPaneState,
  createSurface,
  createTestContext,
  ctrlKey,
  describe,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  dismissNotification,
  ENABLE_MOUSE,
  colorHex,
  expect,
  expectTypeOf,
  FRAME_I18N_CATALOG,
  getDefaultContext,
  hitTestNotificationStack,
  isCmdCleanup,
  it,
  KEY_BACKTICK,
  KEY_CTRL_P,
  KEY_DOWN,
  KEY_ENTER,
  KEY_ESCAPE,
  KEY_SHIFT_TAB,
  KEY_TAB,
  makeLongContent,
  makeModalPage,
  makePage,
  mockClock,
  mouseMove,
  mousePress,
  mouseRelease,
  normalizeViewOutput,
  notify,
  projectFrameControls,
  pushNotification,
  QUIT,
  runFramedApp,
  runScript,
  scheduleKeys,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  stringToSurface,
  surfaceHasBg,
  surfaceHasFg,
  surfaceToString,
  textView,
  tick,
  tickNotifications,
  underlyingFrameLayer,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
};

export type {
  BijouContext,
  Cmd,
  FrameOverlayContext,
  FramePage,
  FramePageMsg,
  FramedApp,
  FramedAppMsg,
  FramedAppUpdateResult,
  MouseMsg,
  Msg,
  NotificationHistoryFilter,
  NotificationState,
  PageModel,
  PageTransition,
  Surface,
};
