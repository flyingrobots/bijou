import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface, type TimerHandle } from '@flyingrobots/bijou';
import { createTestContext, mockClock, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { run, runWithLifecycleHooks } from './runtime.js';
import { quit } from './commands.js';
import type { App, KeyMsg, Cmd } from './types.js';
import { getRenderStageTimings } from './pipeline/pipeline.js';
import {
  ENTER_ALT_SCREEN,
  HIDE_CURSOR,
  WRAP_DISABLE,
  WRAP_ENABLE,
  CLEAR_SCREEN,
  CLEAR_LINE_TO_END,
  CLEAR_TO_END,
  HOME,
  SHOW_CURSOR,
  EXIT_ALT_SCREEN,
} from './screen.js';

const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1006l';
const SHUTDOWN_DRAIN_TIMEOUT_MS = 1000;

function counterApp(quitKey = 'q'): App<number> {
  return {
    init: () => [0, []],
    update(msg: KeyMsg | never, model: number) {
      if (msg.type === 'key') {
        if (msg.key === quitKey) return [model, [quit()]];
        if (msg.key === 'up') return [model + 1, []];
        if (msg.key === 'down') return [Math.max(0, model - 1), []];
      }
      return [model, []];
    },
    view: (model: number) => textView(`count: ${model}`),
  };
}

function singleCellSurface(char?: string) {
  const surface = createSurface(1, 1);
  if (char) {
    surface.set(0, 0, { char, empty: false });
  }
  return surface;
}

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

function createTrackingClock() {
  const base = mockClock();
  const activeTimeouts = new Set<TimerHandle>();

  return {
    clock: {
      ...base,
      setTimeout(callback: () => void, ms: number): TimerHandle {
        let baseHandle: TimerHandle | null = null;
        const wrapper: TimerHandle = {
          dispose() {
            if (!activeTimeouts.delete(wrapper)) return;
            baseHandle?.dispose();
          },
        };

        baseHandle = base.setTimeout(callback, ms);
        activeTimeouts.add(wrapper);
        return wrapper;
      },
    },
    activeTimeoutCount(): number {
      return activeTimeouts.size;
    },
  };
}

/** What renderFrame produces for a given content string. */
function frame(content: string): string {
  const lines = content.split('\n');
  return HOME + lines.map((line) => line + CLEAR_LINE_TO_END).join('\n') + CLEAR_TO_END;
}

function createInteractiveContext(options: Parameters<typeof createTestContext>[0] = {}) {
  const clock = mockClock();
  const ctx = createTestContext({ ...options, mode: 'interactive', clock });
  return { clock, ctx };
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

function scheduleResizes(
  ctx: ReturnType<typeof createTestContext>,
  clock: ReturnType<typeof mockClock>,
  events: { at: number; columns: number; rows: number }[],
): void {
  ctx.io.onResize = (onResize) => {
    const handles = events.map(({ at, columns, rows }) =>
      clock.setTimeout(() => { onResize(columns, rows); }, at)
    );
    return {
      dispose() {
        handles.forEach((handle) => {
          handle.dispose();
        });
      },
    };
  };
}

export {
  CLEAR_LINE_TO_END,
  CLEAR_SCREEN,
  CLEAR_TO_END,
  counterApp,
  createInteractiveContext,
  createSurface,
  createTestContext,
  createTrackingClock,
  describe,
  DISABLE_MOUSE,
  ENTER_ALT_SCREEN,
  EXIT_ALT_SCREEN,
  expect,
  frame,
  getRenderStageTimings,
  HIDE_CURSOR,
  HOME,
  it,
  mockClock,
  quit,
  run,
  runWithLifecycleHooks,
  scheduleKeys,
  scheduleResizes,
  SHOW_CURSOR,
  SHUTDOWN_DRAIN_TIMEOUT_MS,
  singleCellSurface,
  stringToSurface,
  textView,
  WRAP_DISABLE,
  WRAP_ENABLE,
  _resetDefaultContextForTesting,
};

export type {
  App,
  Cmd,
  KeyMsg,
  TimerHandle,
};
