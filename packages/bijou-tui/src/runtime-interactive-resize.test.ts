import {
  App,
  createInteractiveContext,
  describe,
  expect,
  it,
  quit,
  run,
  scheduleKeys,
  scheduleResizes,
  SHUTDOWN_DRAIN_TIMEOUT_MS,
  singleCellSurface,
  textView,
} from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('waits for async cleanup-producing commands to settle before shutdown completes', async () => {
      let disposeCalls = 0;
      const { clock, ctx } = createInteractiveContext();
      const app: App<string, never> = {
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

    it('emits one explicit warning when shutdown drain times out', async () => {
      const { clock, ctx } = createInteractiveContext();
      const app: App<string, never> = {
        init: () => ['hang', [
          () => new Promise(() => {}),
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
