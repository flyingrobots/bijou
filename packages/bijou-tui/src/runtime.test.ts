import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSurface, type TimerHandle } from '@flyingrobots/bijou';
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

afterEach(() => {
  vi.useRealTimers();
});

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
    view: (model: number) => `count: ${model}`,
  };
}

function singleCellSurface(char?: string) {
  const surface = createSurface(1, 1);
  if (char) {
    surface.set(0, 0, { char, empty: false });
  }
  return surface;
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

        baseHandle = base.setTimeout(() => {
          callback();
        }, ms);
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
      vi.useFakeTimers();
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      // First write: enterScreen (alt + hide cursor + wrap disable + clear + home)
      expect(ctx.io.written[0]).toBe(ENTER_ALT_SCREEN + HIDE_CURSOR + WRAP_DISABLE + CLEAR_SCREEN + HOME);
      // Subsequent writes include mouse disable + initial render frame
      const hasInitialRender = ctx.io.written.some((w) => w.includes('count: 0'));
      expect(hasInitialRender).toBe(true);
    });

    it('exits alt screen on quit', async () => {
      vi.useFakeTimers();
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('updates model on key input', async () => {
      vi.useFakeTimers();
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x1b[A', '\x1b[A', 'q'] }, // up, up, quit
      });
      const promise = run(counterApp(), { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      // After two 'up' presses, the rendered frame should contain 'count: 2'
      const hasCount2 = ctx.io.written.some((w) => w.includes('count: 2'));
      expect(hasCount2).toBe(true);
    });

    it('handles double Ctrl+C force-quit', async () => {
      vi.useFakeTimers();

      // App that ignores Ctrl+C (doesn't quit on it)
      const stubbornApp: App<string, never> = {
        init: () => ['running', []],
        update(_msg, model) { return [model, []]; },
        view: (model) => model,
      };

      // Two Ctrl+C in rapid succession
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x03', '\x03'] },
      });
      const promise = run(stubbornApp, { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      // Should have exited despite app not issuing quit
      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('sends first Ctrl+C to app as KeyMsg', async () => {
      vi.useFakeTimers();
      const received: KeyMsg[] = [];

      const spyApp: App<null, never> = {
        init: () => [null, []],
        update(msg, model) {
          if (msg.type === 'key') received.push(msg);
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => 'spy',
      };

      // Ctrl+C then q to quit normally
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x03', 'q'] },
      });
      const promise = run(spyApp, { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
    });

    it('executes startup commands from init', async () => {
      vi.useFakeTimers();
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
        view: (model) => model,
      };

      const ctx = createTestContext({ mode: 'interactive' });
      const promise = run(startupApp, { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      const hasReady = ctx.io.written.some((w) => w.includes('ready'));
      expect(hasReady).toBe(true);
    });

    it('runs init commands before startup resize commands', async () => {
      vi.useFakeTimers();
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
        view: () => 'ordering',
      };

      const ctx = createTestContext({ mode: 'interactive' });
      const promise = run(orderingApp, { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      expect(order).toEqual(['init', 'resize']);
    });

    it('skips alt screen when altScreen is false', async () => {
      vi.useFakeTimers();
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, altScreen: false, hideCursor: false });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      const hasAltScreen = ctx.io.written.some((w) => w.includes(ENTER_ALT_SCREEN));
      expect(hasAltScreen).toBe(false);
    });

    it('allows callers to extend the render pipeline', async () => {
      vi.useFakeTimers();

      const ctx = createTestContext({ mode: 'interactive' });
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

      await vi.advanceTimersByTimeAsync(50);
      await promise;

      expect(ctx.io.written.some((chunk) => chunk.includes('X'))).toBe(true);
    });

    it('forces a clean redraw when the terminal resizes', async () => {
      vi.useFakeTimers();

      const ctx = createTestContext({ mode: 'interactive' });
      ctx.io.rawInput = (onKey) => {
        const id = globalThis.setTimeout(() => onKey('q'), 30);
        return { dispose() { clearTimeout(id); } };
      };
      ctx.io.onResize = (onResize) => {
        const id = globalThis.setTimeout(() => onResize(100, 30), 10);
        return { dispose() { clearTimeout(id); } };
      };

      const promise = run(counterApp(), { ctx });
      await vi.advanceTimersByTimeAsync(80);
      await promise;

      expect(ctx.io.written.some((chunk) => chunk === CLEAR_SCREEN + HOME)).toBe(true);
    });

    it('updates runtime dimensions before rerendering after resize', async () => {
      vi.useFakeTimers();

      const ctx = createTestContext({ mode: 'interactive' });
      const app: App<number, never> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => `size:${ctx.runtime.columns}x${ctx.runtime.rows}`,
      };

      ctx.io.rawInput = (onKey) => {
        const id = globalThis.setTimeout(() => onKey('q'), 30);
        return { dispose() { clearTimeout(id); } };
      };
      ctx.io.onResize = (onResize) => {
        const id = globalThis.setTimeout(() => onResize(100, 30), 10);
        return { dispose() { clearTimeout(id); } };
      };

      const promise = run(app, { ctx });
      await vi.advanceTimersByTimeAsync(80);
      await promise;

      expect(ctx.runtime.columns).toBe(100);
      expect(ctx.runtime.rows).toBe(30);
      expect(ctx.io.written.some((chunk) => chunk.includes('size:100x30'))).toBe(true);
    });

    it('restores the terminal before rejecting when a scheduled render fails', async () => {
      vi.useFakeTimers();

      const ctx = createTestContext({ mode: 'interactive' });
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

      await vi.advanceTimersByTimeAsync(10);
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
        view: (model) => model,
      };

      const promise = run(app, { ctx });
      await clock.advanceByAsync(5);
      await promise;

      expect(activeTimeoutCount()).toBe(0);
    });

    it('does not repeatedly clear the same cell after a surface becomes empty', async () => {
      vi.useFakeTimers();

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

      const ctx = createTestContext({ mode: 'interactive' });
      ctx.io.rawInput = (onKey) => {
        const ids = [
          globalThis.setTimeout(() => onKey('x'), 10),
          globalThis.setTimeout(() => onKey('x'), 20),
          globalThis.setTimeout(() => onKey('q'), 30),
        ];
        return {
          dispose() {
            ids.forEach(clearTimeout);
          },
        };
      };

      const promise = run(app, { ctx });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      const clearWrites = ctx.io.written.filter((chunk) => chunk === '\x1b[1;1H ');
      expect(clearWrites).toHaveLength(1);
    });
  });
});
