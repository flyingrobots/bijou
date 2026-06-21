import { App, createInteractiveContext, describe, expect, it, quit, run, scheduleKeys, SHUTDOWN_DRAIN_TIMEOUT_MS, singleCellSurface, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('waits for async cleanup before shutdown', async () => {
          let disposeCalls = 0;
          const { clock, ctx } = createInteractiveContext();
          const app: App<string> = {
            init: () => ['cleanup', [
              () => new Promise((resolve) => {
                clock.setTimeout(() => {
                  resolve({
                    dispose() {
                      disposeCalls += 1;
                    },
                  });
                }, 25);
              }),
              quit(),
            ]],
            update: (_msg, model) => [model, []],
            view: (model) => textView(model),
          };

          let settled = false;
          const promise = run(app, { ctx }).then(() => {
            settled = true;
          });

          await clock.advanceByAsync(10);
          expect(settled).toBe(false);

          await clock.advanceByAsync(20);
          await promise;

          expect(settled).toBe(true);
          expect(disposeCalls).toBe(1);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('warns when shutdown drain times out', async () => {
          const { clock, ctx } = createInteractiveContext();
          const app: App<string> = {
            init: () => ['hang', [
              () => new Promise<never>((resolve) => void resolve),
              quit(),
            ]],
            update: (_msg, model) => [model, []],
            view: (model) => textView(model),
          };

          let settled = false;
          const promise = run(app, { ctx }).then(() => {
            settled = true;
          });

          await clock.advanceByAsync(SHUTDOWN_DRAIN_TIMEOUT_MS - 1);
          expect(settled).toBe(false);

          await clock.advanceByAsync(2);
          await promise;

          expect(settled).toBe(true);
          expect(ctx.io.writtenErr.some((chunk) =>
            chunk.includes('[Runtime Warning] Timed out waiting 1000ms for pending commands to drain during shutdown.'),
          )).toBe(true);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('does not repeatedly clear the same cell after a surface becomes empty', async () => {
          const app: App<boolean> = {
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
  });
});
