import type { BijouContext } from '@flyingrobots/bijou';
import { run, type App } from '@flyingrobots/bijou-tui';
import { controlApp, createControlChannel, type ControlledApp } from './canvas-app.js';
import type { BijouCanvasContainer, BijouCanvasElement } from './canvas-contract.js';
import { createTextarea, detachNode } from './canvas-elements.js';
import { abortedError, isGpuBackendUnavailable } from './canvas-errors.js';
import { createFrameBridge } from './canvas-frames.js';
import { globalCanvasHost } from './canvas-host.js';
import { negotiateBackend, type LadderRequest, type LadderResult } from './canvas-ladder.js';
import type { BijouCanvasApp, MountBijouCanvasOptions, MountedBijouCanvas } from './canvas-options.js';
import { createCanvasStage } from './canvas-stage.js';
import { createRetargetableSurface, type CanvasGeometry } from './canvas-surface.js';
import { runTextMount } from './canvas-text.js';
import { watchCanvasBox, type CanvasWatch } from './canvas-watch.js';
import { createWebClock } from './clock.js';
import { createWebContext } from './context.js';
import { createWebInteractiveContext } from './context-interactive.js';

/** Wait for a box with area, then negotiate; on failure release everything. */
async function prepare<C extends BijouCanvasElement>(
  watch: CanvasWatch,
  request: LadderRequest<C>,
): Promise<{ readonly geometry: CanvasGeometry; readonly first: LadderResult<C> }> {
  try {
    const geometry = await watch.firstArea();
    return { geometry, first: await negotiateBackend(request) };
  } catch (error: unknown) {
    watch.dispose();
    throw error;
  }
}

/** The app itself, or the app a factory builds from the run's context. */
function resolveApp<Model>(app: BijouCanvasApp<Model>, ctx: BijouContext): App<Model, unknown> {
  return typeof app === 'function' ? app(ctx) : app;
}

/**
 * Mount a TEA app on a `<canvas>` that this function owns inside `container`.
 *
 * In `interactive` mode it waits for the container's first box with area,
 * negotiates a presenter (`'auto'`: `webgpu`, then `webgl2`, then
 * `canvas2d`, each on a fresh canvas, passing over a backend only when it is
 * unavailable), adds a hidden textarea for keyboard, IME and paste input,
 * and runs the app with a `SurfacePresenter` that draws once per animation
 * frame. In any other output mode the app's text goes to the output sinks
 * and no canvas is created.
 *
 * Rejects with the presenter's own error on a renderer fault or a forced
 * backend's unavailability, with `BIJOU_WEB_CANVAS_NO_BACKEND` when the ladder
 * is exhausted, and with `BIJOU_WEB_CANVAS_ABORTED` when `options.signal`
 * aborts first. Nothing stays in `container` after a rejection.
 *
 * @param app - The TEA app, or a function that builds it from the run's context.
 * @param container - The element the canvas and textarea are added to.
 * @param options - Presenter factories, canvas factory, cell size and policy.
 * @returns The running mount.
 */
export async function mountBijouCanvas<Model, C extends BijouCanvasElement>(
  app: BijouCanvasApp<Model>,
  container: BijouCanvasContainer,
  options: MountBijouCanvasOptions<C>,
): Promise<MountedBijouCanvas<Model, C>> {
  if (options.signal?.aborted === true) throw abortedError();
  const clock = options.clock ?? createWebClock();
  const contextOptions = { ...options.context, clock };
  const mode = options.mode ?? createWebContext(contextOptions).mode;
  if (mode !== 'interactive') {
    const textCtx = createWebInteractiveContext({ ...contextOptions, mode });
    const textControl = controlApp(resolveApp(app, textCtx));
    return runTextMount(run(textControl.app, { ctx: textCtx, css: options.css }), () => textControl.model(), textCtx);
  }
  const watch = watchCanvasBox(container, options.host ?? globalCanvasHost, options.cellPx, options.signal);
  const surface = createRetargetableSurface(() => watch.geometry());
  const request: Omit<LadderRequest<C>, 'choice' | 'token'> = {
    presenters: options.presenters,
    createCanvas: options.createCanvas,
    container,
    size: () => watch.geometry()?.size ?? { cssWidth: 1, cssHeight: 1, dpr: 1 },
    isUnavailable: options.isBackendUnavailable ?? isGpuBackendUnavailable,
  };
  const textarea = createTextarea(container, options.createTextarea);
  const { geometry, first } = await prepare(watch, { ...request, choice: options.backend ?? 'auto', token: watch.token });
  watch.releaseSignal();
  const ctx = createWebInteractiveContext({
    ...contextOptions,
    mode,
    runtime: { ...options.context?.runtime, columns: geometry.grid.columns, rows: geometry.grid.rows },
    input: { ...options.input, textarea, surface },
  });
  const channel = createControlChannel();
  const runCtx: BijouContext = { ...ctx, io: { ...ctx.io, onData: (callback: (payload: unknown) => void) => channel.onData(callback) } };
  let control: ControlledApp<Model, unknown>;
  try {
    control = controlApp(resolveApp(app, runCtx), channel);
  } catch (error: unknown) {
    // No stage owns the first presenter yet: release everything made so far.
    watch.dispose();
    ctx.io.dispose();
    first.presenter.dispose();
    detachNode(container, first.canvas);
    throw error;
  }
  let fault: { readonly error: unknown } | undefined;
  const fail = (error: unknown): void => {
    fault ??= { error };
    control.requestStop();
  };
  const bridge = createFrameBridge({ requestFrame: (callback) => clock.requestFrame(() => { callback(); }), onFault: fail });
  const stage = createCanvasStage({ container, textarea, surface, bridge, request, onFault: fail }, first);
  watch.onChange((next) => {
    stage.apply(next);
    ctx.runtime.resize(next.grid.columns, next.grid.rows);
  });
  const done = run(control.app, { ctx: runCtx, presenter: bridge, mouse: true, css: options.css })
    .then(() => { if (fault !== undefined) throw fault.error; })
    .finally(() => {
      stage.teardown();
      watch.dispose();
      ctx.io.dispose();
    });
  let stopping: Promise<void> | undefined;
  return {
    get backend() { return stage.backend(); },
    fallbackReasons: first.fallbackReasons,
    get canvas() { return stage.canvas(); },
    textarea,
    ctx,
    done,
    model: () => control.model(),
    cellFromPoint: (clientX, clientY) => ctx.io.cellFromPoint(clientX, clientY),
    switchBackend: (next) => stage.switchTo(next),
    stop() {
      stopping ??= (async () => {
        stage.close();
        control.requestStop();
        await done.catch(() => undefined);
      })();
      return stopping;
    },
  };
}
