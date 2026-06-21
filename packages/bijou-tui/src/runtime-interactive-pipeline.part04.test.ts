import { App, createInteractiveContext, createTestContext, createTrackingClock, describe, expect, it, quit, run, scheduleKeys, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('auto-exits crash mode when stdin is not a TTY', async () => {
          const { clock, ctx } = createInteractiveContext({
            runtime: { stdinIsTTY: false },
          });
          let onKey: ((key: string) => void) | null = null;
          ctx.io.rawInput = (handler) => {
            onKey = handler;
            return { dispose: () => undefined };
          };

          const app: App<number> = {
            init: () => [7, []],
            update: (_msg, model) => [model, []],
            view: () => {
              throw new Error('render exploded');
            },
          };

          const promise = run(app, { ctx });
          const rejection = promise.catch((error: unknown) => error);

          await clock.advanceByAsync(20);
          await expect(rejection).resolves.toBeInstanceOf(Error);
          await expect(promise).rejects.toThrow('render exploded');
          expect(ctx.io.written.join('')).toContain('Bijou runtime crash');
          expect(ctx.io.written.join('')).toContain('Phase: render');
          expect(onKey).not.toBeNull();
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('does not leave runtime timeout handles active after shutdown', async () => {
          const trackingClock = createTrackingClock();
          const { clock } = trackingClock;
          const ctx = createTestContext({ mode: 'interactive', clock });
          const app: App<string> = {
            init: () => ['bye', [quit()]],
            update: (_msg, model) => [model, []],
            view: (model) => textView(model),
          };

          const promise = run(app, { ctx });
          await clock.advanceByAsync(5);
          await promise;

          expect(trackingClock.activeTimeoutCount()).toBe(0);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('coalesces same-timestamp input bursts into one follow-up render', async () => {
          let viewCalls = 0;
          const app: App<number> = {
            init: () => [0, []],
            update(msg, model) {
              if (msg.type === 'key') {
                if (msg.key === 'q') return [model, [quit()]];
                if (msg.key === 'up') return [model + 1, []];
              }
              return [model, []];
            },
            view(model) {
              viewCalls += 1;
              return textView(`count: ${String(model)}`);
            },
          };

          const { clock, ctx } = createInteractiveContext();
          scheduleKeys(ctx, clock, [
            { at: 1, key: '\x1b[A' },
            { at: 1, key: '\x1b[A' },
            { at: 1, key: '\x1b[A' },
            { at: 5, key: 'q' },
          ]);

          const promise = run(app, { ctx });
          await clock.advanceByAsync(20);
          await promise;

          const renderWrites = ctx.io.written.filter((chunk) => chunk.includes('count:') || chunk.endsWith('3'));
          expect(viewCalls).toBe(2);
          expect(renderWrites).toContainEqual(expect.stringContaining('count: 0'));
          expect(renderWrites.some((chunk) => chunk.endsWith('3'))).toBe(true);
          expect(renderWrites.some((chunk) => chunk.includes('count: 1') || chunk.includes('count: 2'))).toBe(false);
        });
  });
});
