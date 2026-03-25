import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface, type TimerHandle } from '@flyingrobots/bijou';
import { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';
import { run } from './runtime.js';
import { quit } from './commands.js';
import type { App, KeyMsg, Cmd } from './types.js';
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

function counterApp(quitKey = 'q'): App<number, never> {
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
  events: Array<{ at: number; key: string }>,
): void {
  ctx.io.rawInput = (onKey) => {
    const handles = events.map(({ at, key }) => clock.setTimeout(() => onKey(key), at));
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
  events: Array<{ at: number; columns: number; rows: number }>,
): void {
  ctx.io.onResize = (onResize) => {
    const handles = events.map(({ at, columns, rows }) =>
      clock.setTimeout(() => onResize(columns, rows), at)
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

describe('run', () => {
  describe('non-interactive mode', () => {
    it('renders once in pipe mode and returns', async () => {
      const ctx = createTestContext({ mode: 'pipe' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });

    it('renders once in static mode and returns', async () => {
      const ctx = createTestContext({ mode: 'static' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });

    it('renders once in accessible mode and returns', async () => {
      const ctx = createTestContext({ mode: 'accessible' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });
  });

  describe('interactive mode', () => {
    it('enters alt screen and renders initial view', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx });
      await clock.advanceByAsync(50);
      await promise;

      // First write: enterScreen (alt + hide cursor + wrap disable + clear + home)
      expect(ctx.io.written[0]).toBe(ENTER_ALT_SCREEN + HIDE_CURSOR + WRAP_DISABLE + CLEAR_SCREEN + HOME);
      // Subsequent writes include mouse disable + initial render frame
      const hasInitialRender = ctx.io.written.some((w) => w.includes('count: 0'));
      expect(hasInitialRender).toBe(true);
    });

    it('exits alt screen on quit', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx });
      await clock.advanceByAsync(50);
      await promise;

      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('restores mouse reporting before exiting when a mouse-enabled app quits', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, mouse: true });
      await clock.advanceByAsync(50);
      await promise;

      expect(ctx.io.written).toContain(DISABLE_MOUSE);
      expect(ctx.io.written[ctx.io.written.length - 2]).toBe(DISABLE_MOUSE);
      expect(ctx.io.written[ctx.io.written.length - 1]).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('updates model on key input', async () => {
      const seen: number[] = [];
      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key') {
            if (msg.key === 'q') return [model, [quit()]];
            if (msg.key === 'up') {
              const next = model + 1;
              seen.push(next);
              return [next, []];
            }
          }
          return [model, []];
        },
        view: (model) => textView(`count: ${model}`),
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [
        { at: 5, key: '\x1b[A' },
        { at: 10, key: '\x1b[A' },
        { at: 20, key: 'q' },
      ]);
      const promise = run(app, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(seen).toEqual([1, 2]);
    });

    it('handles double Ctrl+C force-quit', async () => {
      // App that ignores Ctrl+C (doesn't quit on it)
      const stubbornApp: App<string, never> = {
        init: () => ['running', []],
        update(_msg, model) { return [model, []]; },
        view: (model) => textView(model),
      };

      // Two Ctrl+C in rapid succession
      const { clock, ctx } = createInteractiveContext({
        io: { keys: ['\x03', '\x03'] },
      });
      const promise = run(stubbornApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      // Should have exited despite app not issuing quit
      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('sends first Ctrl+C to app as KeyMsg', async () => {
      const received: KeyMsg[] = [];

      const spyApp: App<null, never> = {
        init: () => [null, []],
        update(msg, model) {
          if (msg.type === 'key') received.push(msg);
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => textView('spy'),
      };

      // Ctrl+C then q to quit normally
      const { clock, ctx } = createInteractiveContext({
        io: { keys: ['\x03', 'q'] },
      });
      const promise = run(spyApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
    });

    it('does not treat the first Ctrl+C at clock time zero as a double-press', async () => {
      const clock = mockClock({ nowMs: 0 });
      const received: KeyMsg[] = [];

      const spyApp: App<null, never> = {
        init: () => [null, []],
        update(msg, model) {
          if (msg.type === 'key') {
            received.push(msg);
            if (msg.key === 'q') return [model, [quit()]];
          }
          return [model, []];
        },
        view: () => textView('spy'),
      };

      const ctx = createTestContext({ mode: 'interactive', clock });
      ctx.io.rawInput = (onKey) => {
        const handles = [
          clock.setTimeout(() => onKey('\x03'), 0),
          clock.setTimeout(() => onKey('q'), 10),
        ];
        return {
          dispose() {
            handles.forEach((handle) => {
              handle.dispose();
            });
          },
        };
      };

      const promise = run(spyApp, { ctx });
      await clock.advanceByAsync(20);
      await promise;

      expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
      expect(received.some((msg) => msg.key === 'q')).toBe(true);
    });

    it('executes startup commands from init', async () => {
      type Msg = { type: 'started' };

      const startupApp: App<string, Msg> = {
        init() {
          const cmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'started' as const });
          return ['loading', [cmd]];
        },
        update(msg, _model) {
          if ('type' in msg && msg.type === 'started') return ['ready', [quit<Msg>()]];
          return ['loading', []];
        },
        view: (model) => textView(model),
      };

      const { clock, ctx } = createInteractiveContext();
      const promise = run(startupApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      const hasReady = ctx.io.written.some((w) => w.includes('ready'));
      expect(hasReady).toBe(true);
    });

    it('routes rejected commands through the app runtime issue hook', async () => {
      type Msg = { type: 'issue'; text: string };
      const seenIssues: string[] = [];

      const rejectingApp: App<string, Msg> = {
        init() {
          const rejectCmd: Cmd<Msg> = async () => {
            throw new Error('boom');
          };
          return ['idle', [rejectCmd]];
        },
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') {
            return [model, [quit<Msg>()]];
          }
          if ('type' in msg && msg.type === 'issue') {
            seenIssues.push(msg.text);
            return [`issue:${msg.text}`, []];
          }
          return ['idle', []];
        },
        view: (model) => textView(model),
        routeRuntimeIssue(issue) {
          return { type: 'issue', text: `${issue.source}:${issue.message}` };
        },
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
      const promise = run(rejectingApp, { ctx });
      await clock.advanceByAsync(100);
      await promise;

      expect(ctx.io.writtenErr.some((chunk) => chunk.includes('[EventBus] Command rejected: Error: boom'))).toBe(true);
      expect(seenIssues).toContain('command:Error: boom');
    });

    it('runs init commands before startup resize commands', async () => {
      type Msg = { type: 'init-cmd' } | { type: 'resize-cmd' };
      const order: string[] = [];

      const orderingApp: App<null, Msg> = {
        init() {
          const initCmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'init-cmd' });
          return [null, [initCmd]];
        },
        update(msg, model) {
          if (msg.type === 'resize') {
            const resizeCmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'resize-cmd' });
            return [model, [resizeCmd]];
          }
          if (msg.type === 'init-cmd') order.push('init');
          if (msg.type === 'resize-cmd') order.push('resize');
          if (order.length >= 2) return [model, [quit<Msg>()]];
          return [model, []];
        },
        view: () => textView('ordering'),
      };

      const { clock, ctx } = createInteractiveContext();
      const promise = run(orderingApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(order).toEqual(['init', 'resize']);
    });

    it('skips alt screen when altScreen is false', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, altScreen: false, hideCursor: false });
      await clock.advanceByAsync(50);
      await promise;

      const hasAltScreen = ctx.io.written.some((w) => w.includes(ENTER_ALT_SCREEN));
      expect(hasAltScreen).toBe(false);
    });

    it('allows callers to extend the render pipeline', async () => {
      const { clock, ctx } = createInteractiveContext();
      const app: App<null, never> = {
        init: () => [null, [quit()]],
        update: (_msg, model) => [model, []],
        view: () => {
          const surface = createSurface(4, 1);
          surface.set(0, 0, { char: 'A', empty: false });
          return surface;
        },
      };

      const promise = run(app, {
        ctx,
        configurePipeline(pipeline) {
          pipeline.use('PostProcess', (state, next) => {
            state.targetSurface.set(0, 0, { char: 'X', empty: false });
            next();
          });
        },
      });

      await clock.advanceByAsync(50);
      await promise;

      expect(ctx.io.written.some((chunk) => chunk.includes('X'))).toBe(true);
    });

    it('forces a clean redraw when the terminal resizes', async () => {
      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
      scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);

      const promise = run(counterApp(), { ctx });
      await clock.advanceByAsync(80);
      await promise;

      expect(ctx.io.written.some((chunk) => chunk === CLEAR_SCREEN + HOME)).toBe(true);
    });

    it('updates runtime dimensions before rerendering after resize', async () => {
      const { clock, ctx } = createInteractiveContext();
      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => textView(`size:${ctx.runtime.columns}x${ctx.runtime.rows}`),
      };

      scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
      scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);

      const promise = run(app, { ctx });
      await clock.advanceByAsync(80);
      await promise;

      expect(ctx.runtime.columns).toBe(100);
      expect(ctx.runtime.rows).toBe(30);
      expect(ctx.io.written.some((chunk) => chunk.includes('size:100x30'))).toBe(true);
    });

    it('restores the terminal before rejecting when a scheduled render fails', async () => {
      const { clock, ctx } = createInteractiveContext();
      const promise = run(counterApp(), { ctx });
      const rejection = promise.then(
        () => null,
        (error) => error,
      );

      let columns = ctx.runtime.columns;
      Object.defineProperty(ctx.runtime, 'columns', {
        configurable: true,
        get() {
          throw new Error('render exploded');
        },
        set(value: number) {
          columns = value;
        },
      });

      await clock.advanceByAsync(10);
      await expect(rejection).resolves.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow('render exploded');
      expect(columns).toBe(80);
      expect(ctx.io.written[ctx.io.written.length - 1]).toBe(
        SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN,
      );
    });

    it('does not leave runtime timeout handles active after shutdown', async () => {
      const { clock, activeTimeoutCount } = createTrackingClock();
      const ctx = createTestContext({ mode: 'interactive', clock });
      const app: App<string, never> = {
        init: () => ['bye', [quit()]],
        update: (_msg, model) => [model, []],
        view: (model) => textView(model),
      };

      const promise = run(app, { ctx });
      await clock.advanceByAsync(5);
      await promise;

      expect(activeTimeoutCount()).toBe(0);
    });

    it('does not repeatedly clear the same cell after a surface becomes empty', async () => {
      const app: App<boolean, never> = {
        init: () => [true, []],
        update(msg, model) {
          if (msg.type === 'key') {
            if (msg.key === 'x') return [false, []];
            if (msg.key === 'q') return [model, [quit()]];
          }
          return [model, []];
        },
        view: (model) => (model ? singleCellSurface('X') : singleCellSurface()),
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [
        { at: 10, key: 'x' },
        { at: 20, key: 'x' },
        { at: 30, key: 'q' },
      ]);

      const promise = run(app, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      const clearWrites = ctx.io.written.filter((chunk) => chunk === '\x1b[1;1H ');
      expect(clearWrites).toHaveLength(1);
    });

    it('reuses two framebuffers across steady-state renders', async () => {
      const seen: Array<{ current: object; target: object }> = [];

      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'pulse' && model < 2) return [model + 1, []];
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: (model) => textView(`count: ${model}`),
      };

      const { clock, ctx } = createInteractiveContext({ runtime: { refreshRate: 60 } });
      scheduleKeys(ctx, clock, [{ at: 60, key: 'q' }]);

      const promise = run(app, {
        ctx,
        configurePipeline(pipeline) {
          pipeline.use('Output', (state, next) => {
            seen.push({
              current: state.currentSurface,
              target: state.targetSurface,
            });
            next();
          });
        },
      });

      await clock.advanceByAsync(120);
      await promise;

      expect(seen.length).toBeGreaterThanOrEqual(3);
      expect(seen[1]?.current).toBe(seen[0]?.target);
      expect(seen[2]?.current).toBe(seen[1]?.target);

      const uniqueTargets = new Set(seen.map((entry) => entry.target));
      expect(uniqueTargets.size).toBeLessThanOrEqual(2);
    });

    it('skips rerendering when update returns the same model reference', async () => {
      let viewCalls = 0;
      const model = { count: 0 };

      const app: App<typeof model, never> = {
        init: () => [model, []],
        update(msg, current) {
          if (msg.type === 'key' && msg.key === 'x') return [current, []];
          if (msg.type === 'key' && msg.key === 'q') return [current, [quit()]];
          return [current, []];
        },
        view(current) {
          viewCalls += 1;
          return textView(`count: ${current.count}`);
        },
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [
        { at: 10, key: 'x' },
        { at: 20, key: 'q' },
      ]);

      const promise = run(app, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(viewCalls).toBe(1);
    });

    it('skips idle pulse rerenders when the model is unchanged', async () => {
      let viewCalls = 0;
      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view(model) {
          viewCalls += 1;
          return textView(`count: ${model}`);
        },
      };

      const { clock, ctx } = createInteractiveContext({ runtime: { refreshRate: 60 } });
      scheduleKeys(ctx, clock, [{ at: 70, key: 'q' }]);

      const promise = run(app, { ctx });
      await clock.advanceByAsync(120);
      await promise;

      expect(viewCalls).toBe(1);
    });

    it('still rerenders on resize when update returns the same model reference', async () => {
      let viewCalls = 0;
      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view(model) {
          viewCalls += 1;
          return textView(`count: ${model}`);
        },
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);
      scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);

      const promise = run(app, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(viewCalls).toBe(2);
    });
  });
});
