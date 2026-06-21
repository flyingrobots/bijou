import { App, CLEAR_SCREEN, createInteractiveContext, createSurface, describe, expect, HOME, it, quit, run, scheduleKeys, scheduleResizes, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('repaints blank cells after resize instead of relying on terminal clear', async () => {
          const { clock, ctx } = createInteractiveContext({ runtime: { columns: 1, rows: 1 } });
          const app: App<null> = {
            init: () => [null, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view: () => {
              const surface = createSurface(ctx.runtime.columns, ctx.runtime.rows);
              surface.set(0, 0, { char: 'X', empty: false });
              return surface;
            },
          };

          scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
          scheduleResizes(ctx, clock, [{ at: 10, columns: 4, rows: 1 }]);

          const promise = run(app, { ctx });
          await clock.advanceByAsync(80);
          await promise;

          const clearIndex = ctx.io.written.findIndex((chunk) => chunk === CLEAR_SCREEN + HOME);
          expect(clearIndex).toBeGreaterThanOrEqual(0);
          const resizePaint = ctx.io.written.slice(clearIndex + 1).find((chunk) => chunk.includes('\x1b[1;1H'));
          expect(resizePaint).toContain('\x1b[1;1HX   ');
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('keeps the invalidated resize buffer reusable as a blank back buffer', async () => {
          const { clock, ctx } = createInteractiveContext({ runtime: { columns: 1, rows: 1 } });
          const app: App<boolean> = {
            init: () => [true, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'x') return [false, []];
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view: (model) => {
              const surface = createSurface(ctx.runtime.columns, ctx.runtime.rows);
              if (model) {
                surface.set(0, 0, { char: 'X', empty: false });
              }
              return surface;
            },
          };

          scheduleKeys(ctx, clock, [
            { at: 30, key: 'x' },
            { at: 60, key: 'q' },
          ]);
          scheduleResizes(ctx, clock, [{ at: 10, columns: 4, rows: 1 }]);

          const promise = run(app, { ctx });
          await clock.advanceByAsync(100);
          await promise;

          expect(ctx.io.written.join('')).not.toContain('\0');
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('updates runtime dimensions before rerendering after resize', async () => {
          const { clock, ctx } = createInteractiveContext();
          const app: App<number> = {
            init: () => [0, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view: () => textView(`size:${String(ctx.runtime.columns)}x${String(ctx.runtime.rows)}`),
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
  });
});
