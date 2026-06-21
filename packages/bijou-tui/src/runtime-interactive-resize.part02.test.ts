import { App, createInteractiveContext, describe, expect, it, quit, run, scheduleKeys, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('reuses two framebuffers across steady-state renders', async () => {
          const seen: { current: object; target: object }[] = [];

          const app: App<number> = {
            init: () => [0, []],
            update(msg, model) {
              if (msg.type === 'pulse' && model < 2) return [model + 1, []];
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view: (model) => textView(`count: ${String(model)}`),
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
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('skips rerendering when update returns the same model reference', async () => {
          let viewCalls = 0;
          const model = { count: 0 };

          const app: App<typeof model> = {
            init: () => [model, []],
            update(msg, current) {
              if (msg.type === 'key' && msg.key === 'x') return [current, []];
              if (msg.type === 'key' && msg.key === 'q') return [current, [quit()]];
              return [current, []];
            },
            view(current) {
              viewCalls += 1;
              return textView(`count: ${String(current.count)}`);
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
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('skips idle pulse rerenders when the model is unchanged', async () => {
          let viewCalls = 0;
          const app: App<number> = {
            init: () => [0, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view(model) {
              viewCalls += 1;
              return textView(`count: ${String(model)}`);
            },
          };

          const { clock, ctx } = createInteractiveContext({ runtime: { refreshRate: 60 } });
          scheduleKeys(ctx, clock, [{ at: 70, key: 'q' }]);

          const promise = run(app, { ctx });
          await clock.advanceByAsync(120);
          await promise;

          expect(viewCalls).toBe(1);
        });
  });
});
