import {
  App,
  CLEAR_SCREEN,
  counterApp,
  createInteractiveContext,
  createSurface,
  createTestContext,
  createTrackingClock,
  describe,
  EXIT_ALT_SCREEN,
  expect,
  frame,
  HOME,
  it,
  quit,
  run,
  runWithLifecycleHooks,
  scheduleKeys,
  scheduleResizes,
  SHOW_CURSOR,
  textView,
  WRAP_ENABLE,
} from './runtime.test-support.js';

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

    it('forces a clean redraw when the terminal resizes', async () => {
      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [{ at: 30, key: 'q' }]);
      scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);

      const promise = run(counterApp(), { ctx });
      await clock.advanceByAsync(80);
      await promise;

      expect(ctx.io.written.some((chunk) => chunk === CLEAR_SCREEN + HOME)).toBe(true);
    });

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

    it('updates runtime dimensions before rerendering after resize', async () => {
      const { clock, ctx } = createInteractiveContext();
      const app: App<number> = {
        init: () => [0, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => textView(`size:${ctx.runtime.columns}x${ctx.runtime.rows}`),
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

    it('restores the terminal before rejecting when a scheduled render fails', async () => {
      const { clock, ctx } = createInteractiveContext();
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

      await clock.advanceByAsync(10);
      await expect(rejection).resolves.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow('render exploded');
      expect(columns).toBe(80);
      expect(ctx.io.written[ctx.io.written.length - 1]).toBe(
        SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN,
      );
    });

    it('renders a crash surface and waits for enter when update throws', async () => {
      const { clock, ctx } = createInteractiveContext();
      let settled = false;
      const app: App<{ count: number }> = {
        init: () => [{ count: 3 }, []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'up') {
            throw new Error('update exploded');
          }
          return [model, []];
        },
        view: (model) => textView(`count:${model.count}`),
      };

      scheduleKeys(ctx, clock, [
        { at: 5, key: '\x1b[A' },
        { at: 20, key: '\r' },
      ]);

      const promise = run(app, { ctx });
      const rejection = promise.then(
        () => null,
        (error) => error,
      );
      rejection.finally(() => {
        settled = true;
      });

      await clock.advanceByAsync(10);
      const written = ctx.io.written.join('');
      expect(settled).toBe(false);
      expect(written).toContain('Bijou runtime crash');
      expect(written).toContain('Phase: update');
      expect(written).toContain('update exploded');
      expect(written).toContain('Press Enter to exit.');
      expect(written).toContain('"count": 3');

      await clock.advanceByAsync(40);
      await expect(rejection).resolves.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow('update exploded');
    });

    it('renders a crash surface and waits for enter when render fails', async () => {
      const { clock, ctx } = createInteractiveContext();
      let settled = false;
      const app: App<number> = {
        init: () => [7, []],
        update: (_msg, model) => [model, []],
        view: () => {
          throw new Error('render exploded');
        },
      };

      scheduleKeys(ctx, clock, [{ at: 50, key: '\r' }]);

      const promise = run(app, { ctx });
      const rejection = promise.then(
        () => null,
        (error) => error,
      );
      rejection.finally(() => {
        settled = true;
      });

      await clock.advanceByAsync(20);
      const written = ctx.io.written.join('');
      expect(settled).toBe(false);
      expect(written).toContain('Bijou runtime crash');
      expect(written).toContain('Phase: render');
      expect(written).toContain('render exploded');
      expect(written).toContain('Press Enter to exit.');
      expect(written).toContain('7');

      await clock.advanceByAsync(60);
      await expect(rejection).resolves.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow('render exploded');
    });

    it('auto-exits crash mode when stdin is not a TTY', async () => {
      const { clock, ctx } = createInteractiveContext({
        runtime: { stdinIsTTY: false },
      });
      let onKey: ((key: string) => void) | null = null;
      ctx.io.rawInput = (handler) => {
        onKey = handler;
        return { dispose() {} };
      };

      const app: App<number> = {
        init: () => [7, []],
        update: (_msg, model) => [model, []],
        view: () => {
          throw new Error('render exploded');
        },
      };

      const promise = run(app, { ctx });
      const rejection = promise.then(
        () => null,
        (error) => error,
      );

      await clock.advanceByAsync(20);
      await expect(rejection).resolves.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow('render exploded');
      expect(ctx.io.written.join('')).toContain('Bijou runtime crash');
      expect(ctx.io.written.join('')).toContain('Phase: render');
      expect(onKey).not.toBeNull();
    });

    it('does not leave runtime timeout handles active after shutdown', async () => {
      const { clock, activeTimeoutCount } = createTrackingClock();
      const ctx = createTestContext({ mode: 'interactive', clock });
      const app: App<string> = {
        init: () => ['bye', [quit()]],
        update: (_msg, model) => [model, []],
        view: (model) => textView(model),
      };

      const promise = run(app, { ctx });
      await clock.advanceByAsync(5);
      await promise;

      expect(activeTimeoutCount()).toBe(0);
    });

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
          return textView(`count: ${model}`);
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

    it('disposes cleanup-producing commands during shutdown', async () => {
      let disposeCalls = 0;
      const dispose = () => {
        disposeCalls += 1;
      };
      const { clock, ctx } = createInteractiveContext();
      const app: App<string> = {
        init: () => ['cleanup', [() => ({ dispose }), quit()]],
        update: (_msg, model) => [model, []],
        view: (model) => textView(model),
      };

      const promise = run(app, { ctx });
      await clock.advanceByAsync(20);
      await promise;

      expect(disposeCalls).toBe(1);
    });
  });
});
