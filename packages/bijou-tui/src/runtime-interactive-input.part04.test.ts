import { App, counterApp, createInteractiveContext, createSurface, describe, ENTER_ALT_SCREEN, expect, getRenderStageTimings, it, quit, run } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('skips alt screen when altScreen is false', async () => {
          const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
          const promise = run(counterApp(), { ctx, altScreen: false, hideCursor: false });
          await clock.advanceByAsync(50);
          await promise;
          const hasAltScreen = ctx.io.written.some((w) => w.includes(ENTER_ALT_SCREEN));
          expect(hasAltScreen).toBe(false);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('allows callers to extend the render pipeline', async () => {
          const { clock, ctx } = createInteractiveContext();
          const app: App<null> = {
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
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('exposes per-stage pipeline timings through observers and render state data', async () => {
          const { clock, ctx } = createInteractiveContext();
          const completed: string[] = [];
          const seenDuringDiff: string[][] = [];
          const app: App<null> = {
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
              pipeline.onStageComplete((stage, _durationMs, state) => {
                completed.push(stage);
                if (stage === 'Diff') {
                  seenDuringDiff.push(getRenderStageTimings(state).map((timing) => timing.stage));
                }
              });
            },
          });
          await clock.advanceByAsync(50);
          await promise;
          expect(completed).toEqual(['Layout', 'Paint', 'PostProcess', 'Diff', 'Output']);
          expect(seenDuringDiff).toEqual([['Layout', 'Paint', 'PostProcess', 'Diff']]);
        });
  });
});
