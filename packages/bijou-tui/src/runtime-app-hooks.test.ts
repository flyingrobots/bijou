import { createSurface } from '@flyingrobots/bijou';
import { createFramedApp } from './app-frame.js';
import { counterApp, createInteractiveContext, describe, expect, it, run, scheduleKeys } from './runtime.test-support.js';

describe('run() and the render hooks an app supplies', () => {
  it('asks the app for its hooks once per run and calls them around each render', async () => {
    const { clock, ctx } = createInteractiveContext();
    let asked = 0;
    let rendered = 0;
    const app = {
      ...counterApp(),
      runtimeHooks: () => {
        asked += 1;
        return { afterRender: () => { rendered += 1; return undefined; } };
      },
    };
    scheduleKeys(ctx, clock, [{ at: 20, key: 'up' }, { at: 40, key: 'q' }]);
    const done = run(app, { ctx });
    await clock.advanceByAsync(100);
    await done;
    expect(asked).toBe(1);
    expect(rendered).toBeGreaterThan(0);
  });

  it('gives a framed app run through run() the timing hooks its perf HUD reads', () => {
    const { ctx } = createInteractiveContext();
    const app = createFramedApp<{ readonly n: number }, never>({
      ctx,
      title: 'hooks',
      pages: [{
        id: 'only', title: 'Only',
        init: () => [{ n: 0 }, []],
        update: (_msg, model) => [model, []],
        layout: () => ({ kind: 'pane', paneId: 'body', render: (width, height) => createSurface(width, height) }),
      }],
    });
    const hooks = app.runtimeHooks?.(ctx);
    const [model] = app.init();
    // Before any render there is no measurement to apply: the model passes through unchanged.
    expect(hooks?.beforeRender?.(model)).toBe(model);
    const after = hooks?.afterRender?.({
      model, dt: 16, viewport: { columns: 80, rows: 24 },
      timings: [{ stage: 'Layout', durationMs: 4 }, { stage: 'Diff', durationMs: 1 }],
    });
    // The first render asks for a second one, so the HUD shows measured numbers straight away.
    expect(after).toEqual({ requestRender: true });
    const measured = hooks?.beforeRender?.(model);
    expect(measured?.viewTimeMs).toBe(4);
    expect(measured?.diffTimeMs).toBe(1);
    expect(measured?.frameTimeMs).toBe(5);
  });
});
