import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
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
      const hasInitialRender = ctx.io.written.some((w) => w === frame('count: 0'));
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
          const cmd: Cmd<Msg> = async (_emit) => ({ type: 'started' as const });
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

    it('skips alt screen when altScreen is false', async () => {
      vi.useFakeTimers();
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, altScreen: false, hideCursor: false });
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      const hasAltScreen = ctx.io.written.some((w) => w.includes(ENTER_ALT_SCREEN));
      expect(hasAltScreen).toBe(false);
    });
  });
});
