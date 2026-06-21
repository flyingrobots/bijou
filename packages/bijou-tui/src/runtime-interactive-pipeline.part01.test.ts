import { App, CLEAR_SCREEN, counterApp, createInteractiveContext, createSurface, describe, expect, HOME, it, quit, run, runWithLifecycleHooks, scheduleKeys, scheduleResizes, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('lets internal callers fold committed frame timings back into model state', async () => {
          const { clock, ctx } = createInteractiveContext();
          const seenFrameTimes: number[] = [];
          const app: App<{ frameTimeMs: number }> = {
            init: () => [{ frameTimeMs: 0 }, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') {
                seenFrameTimes.push(model.frameTimeMs);
                return [model, [quit()]];
              }
              return [model, []];
            },
            view: () => {
              const surface = createSurface(4, 1);
              surface.set(0, 0, { char: 'A', empty: false });
              return surface;
            },
          };

          scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
          const promise = runWithLifecycleHooks(app, { ctx }, {
            afterRender({ model, timings }) {
              return { model: {
                ...model,
                frameTimeMs: timings.reduce((total, timing) => total + timing.durationMs, 0),
              } };
            },
          });

          await clock.advanceByAsync(50);
          await promise;

          expect(seenFrameTimes).toHaveLength(1);
          expect(seenFrameTimes[0]).toBeGreaterThan(0);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('supports one-shot follow-up renders for lifecycle-driven model hydration', async () => {
          const { clock, ctx } = createInteractiveContext();
          let shouldHydrate = false;
          let hydratedSeenOnQuit = false;
          const app: App<{ hydrated: boolean }> = {
            init: () => [{ hydrated: false }, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') {
                hydratedSeenOnQuit = model.hydrated;
                return [model, [quit()]];
              }
              return [model, []];
            },
            view: (model) => textView(`hydrated:${model.hydrated ? 'yes' : 'no'}`),
          };

          scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
          const promise = runWithLifecycleHooks(app, { ctx }, {
            beforeRender(model) {
              return shouldHydrate ? { ...model, hydrated: true } : model;
            },
            afterRender() {
              if (shouldHydrate) return;
              shouldHydrate = true;
              return { requestRender: true };
            },
          });

          await clock.advanceByAsync(80);
          await promise;

          expect(hydratedSeenOnQuit).toBe(true);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('forces a clean redraw when the terminal resizes', async () => {
          const { clock, ctx } = createInteractiveContext();
          scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
          scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);

          const promise = run(counterApp(), { ctx });
          await clock.advanceByAsync(80);
          await promise;

          expect(ctx.io.written.some((chunk) => chunk === CLEAR_SCREEN + HOME)).toBe(true);
        });
  });
});
