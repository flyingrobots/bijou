import { App, CLEAR_SCREEN, counterApp, createInteractiveContext, describe, DISABLE_MOUSE, ENTER_ALT_SCREEN, EXIT_ALT_SCREEN, expect, HIDE_CURSOR, HOME, it, quit, run, scheduleKeys, SHOW_CURSOR, textView, WRAP_DISABLE, WRAP_ENABLE } from './runtime.test-support.js';
import { must } from '@flyingrobots/bijou/adapters/test';

describe('run', () => {
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
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('exits alt screen on quit', async () => {
          const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
          const promise = run(counterApp(), { ctx });
          await clock.advanceByAsync(50);
          await promise;

          const lastWrite = must(ctx.io.written[ctx.io.written.length - 1]);
          expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('restores mouse reporting before exiting when a mouse-enabled app quits', async () => {
          const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
          const promise = run(counterApp(), { ctx, mouse: true });
          await clock.advanceByAsync(50);
          await promise;
          expect(ctx.io.written).toContain(DISABLE_MOUSE);
          expect(ctx.io.written[ctx.io.written.length - 2]).toBe(DISABLE_MOUSE);
          expect(ctx.io.written[ctx.io.written.length - 1]).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('updates model on key input', async () => {
          const seen: number[] = [];
          const app: App<number> = {
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
            view: (model) => textView(`count: ${model.toString()}`),
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
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('handles double Ctrl+C force-quit', async () => {
          // App that ignores Ctrl+C (doesn't quit on it)
          const stubbornApp: App<string> = {
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
          const lastWrite = must(ctx.io.written[ctx.io.written.length - 1]);
          expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
        });
  });
});
