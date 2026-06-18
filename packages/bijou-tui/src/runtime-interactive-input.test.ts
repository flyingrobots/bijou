import {
  App,
  CLEAR_SCREEN,
  Cmd,
  counterApp,
  createInteractiveContext,
  createSurface,
  createTestContext,
  describe,
  DISABLE_MOUSE,
  ENTER_ALT_SCREEN,
  EXIT_ALT_SCREEN,
  expect,
  frame,
  getRenderStageTimings,
  HIDE_CURSOR,
  HOME,
  it,
  KeyMsg,
  mockClock,
  quit,
  run,
  scheduleKeys,
  SHOW_CURSOR,
  textView,
  WRAP_DISABLE,
  WRAP_ENABLE,
} from './runtime.test-support.js';

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

    it('exits alt screen on quit', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx });
      await clock.advanceByAsync(50);
      await promise;

      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('restores mouse reporting before exiting when a mouse-enabled app quits', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, mouse: true });
      await clock.advanceByAsync(50);
      await promise;

      expect(ctx.io.written).toContain(DISABLE_MOUSE);
      expect(ctx.io.written[ctx.io.written.length - 2]).toBe(DISABLE_MOUSE);
      expect(ctx.io.written[ctx.io.written.length - 1]).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

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
        view: (model) => textView(`count: ${model}`),
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
      const lastWrite = ctx.io.written[ctx.io.written.length - 1]!;
      expect(lastWrite).toBe(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
    });

    it('sends first Ctrl+C to app as KeyMsg', async () => {
      const received: KeyMsg[] = [];

      const spyApp: App<null> = {
        init: () => [null, []],
        update(msg, model) {
          if (msg.type === 'key') received.push(msg);
          if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
          return [model, []];
        },
        view: () => textView('spy'),
      };

      // Ctrl+C then q to quit normally
      const { clock, ctx } = createInteractiveContext({
        io: { keys: ['\x03', 'q'] },
      });
      const promise = run(spyApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
    });

    it('does not treat the first Ctrl+C at clock time zero as a double-press', async () => {
      const clock = mockClock({ nowMs: 0 });
      const received: KeyMsg[] = [];

      const spyApp: App<null> = {
        init: () => [null, []],
        update(msg, model) {
          if (msg.type === 'key') {
            received.push(msg);
            if (msg.key === 'q') return [model, [quit()]];
          }
          return [model, []];
        },
        view: () => textView('spy'),
      };

      const ctx = createTestContext({ mode: 'interactive', clock });
      ctx.io.rawInput = (onKey) => {
        const handles = [
          clock.setTimeout(() => { onKey('\x03'); }, 0),
          clock.setTimeout(() => { onKey('q'); }, 10),
        ];
        return {
          dispose() {
            handles.forEach((handle) => {
              handle.dispose();
            });
          },
        };
      };

      const promise = run(spyApp, { ctx });
      await clock.advanceByAsync(20);
      await promise;

      expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
      expect(received.some((msg) => msg.key === 'q')).toBe(true);
    });

    it('executes startup commands from init', async () => {
      interface Msg { type: 'started' }

      const startupApp: App<string, Msg> = {
        init() {
          const cmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'started' as const });
          return ['loading', [cmd]];
        },
        update(msg, _model) {
          if ('type' in msg && msg.type === 'started') return ['ready', [quit<Msg>()]];
          return ['loading', []];
        },
        view: (model) => textView(model),
      };

      const { clock, ctx } = createInteractiveContext();
      const promise = run(startupApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      const hasReady = ctx.io.written.some((w) => w.includes('ready'));
      expect(hasReady).toBe(true);
    });

    it('routes rejected commands through the app runtime issue hook', async () => {
      interface Msg { type: 'issue'; text: string }
      const seenIssues: string[] = [];

      const rejectingApp: App<string, Msg> = {
        init() {
          const rejectCmd: Cmd<Msg> = async () => {
            throw new Error('boom');
          };
          return ['idle', [rejectCmd]];
        },
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') {
            return [model, [quit<Msg>()]];
          }
          if ('type' in msg && msg.type === 'issue') {
            seenIssues.push(msg.text);
            return [`issue:${msg.text}`, []];
          }
          return ['idle', []];
        },
        view: (model) => textView(model),
        routeRuntimeIssue(issue) {
          return { type: 'issue', text: `${issue.source}:${issue.message}` };
        },
      };

      const { clock, ctx } = createInteractiveContext();
      scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
      const promise = run(rejectingApp, { ctx });
      await clock.advanceByAsync(100);
      await promise;

      expect(ctx.io.writtenErr.some((chunk) => chunk.includes('[EventBus] Command rejected: Error: boom'))).toBe(true);
      expect(seenIssues).toContain('command:Error: boom');
    });

    it('routes opt-in surface budget warnings through the app runtime issue hook', async () => {
      interface Msg { type: 'issue'; text: string }
      const seenIssues: string[] = [];

      const budgetedApp: App<string, Msg> = {
        init: () => ['idle', []],
        update(msg, model) {
          if (msg.type === 'key' && msg.key === 'q') {
            return [model, [quit<Msg>()]];
          }
          if (msg.type === 'issue') {
            seenIssues.push(msg.text);
            return [`issue:${msg.text}`, []];
          }
          return [model, []];
        },
        view() {
          return createSurface(4, 4, { char: '.', empty: false });
        },
        routeRuntimeIssue(issue) {
          return {
            type: 'issue',
            text: `${issue.level}:${issue.source}:${issue.message}`,
          };
        },
      };

      const { clock, ctx } = createInteractiveContext({ runtime: { columns: 4, rows: 4 } });
      scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
      const promise = run(budgetedApp, {
        ctx,
        surfaceBudget: { maxArea: 1 },
      });
      await clock.advanceByAsync(100);
      await promise;

      expect(seenIssues).toContain('warning:runtime:surface surface-area 16 > 1');
    });

    it('runs init commands before startup resize commands', async () => {
      type Msg = { type: 'init-cmd' } | { type: 'resize-cmd' };
      const order: string[] = [];

      const orderingApp: App<null, Msg> = {
        init() {
          const initCmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'init-cmd' });
          return [null, [initCmd]];
        },
        update(msg, model) {
          if (msg.type === 'resize') {
            const resizeCmd: Cmd<Msg> = async (_emit, _caps) => ({ type: 'resize-cmd' });
            return [model, [resizeCmd]];
          }
          if (msg.type === 'init-cmd') order.push('init');
          if (msg.type === 'resize-cmd') order.push('resize');
          if (order.length >= 2) return [model, [quit<Msg>()]];
          return [model, []];
        },
        view: () => textView('ordering'),
      };

      const { clock, ctx } = createInteractiveContext();
      const promise = run(orderingApp, { ctx });
      await clock.advanceByAsync(50);
      await promise;

      expect(order).toEqual(['init', 'resize']);
    });

    it('skips alt screen when altScreen is false', async () => {
      const { clock, ctx } = createInteractiveContext({ io: { keys: ['q'] } });
      const promise = run(counterApp(), { ctx, altScreen: false, hideCursor: false });
      await clock.advanceByAsync(50);
      await promise;

      const hasAltScreen = ctx.io.written.some((w) => w.includes(ENTER_ALT_SCREEN));
      expect(hasAltScreen).toBe(false);
    });

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
