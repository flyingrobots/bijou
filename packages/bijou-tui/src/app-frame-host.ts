import type { App } from './types.js';
import { runWithLifecycleHooks } from './runtime.js';
import type {
  FrameModel,
  FramedApp,
  FramedAppMsg,
  FramedAppRunOptions,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  applyFrameTimingSnapshot,
  resolveFrameBudgetMs,
} from './app-frame-performance-runtime.js';
import {
  summarizeFrameTimings,
  type FrameTimingSnapshot,
} from './app-frame-performance.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import type { RuntimeLifecycleHooks } from './runtime-contract.js';

const isInternalFrameModel = <PageModel, Msg>(
  model: FrameModel<PageModel>,
): model is InternalFrameModel<PageModel, Msg> =>
  'helpScrollY' in model && 'warnedFrameKeyCollisionPages' in model;

const requireInternalFrameModel = <PageModel, Msg>(
  model: FrameModel<PageModel>,
): InternalFrameModel<PageModel, Msg> => {
  if (isInternalFrameModel<PageModel, Msg>(model)) return model;
  throw new Error('createFramedApp: framed runtime received a non-frame model');
};

/**
 * Render hooks that carry the runtime's measured frame timings into the frame model, where the perf HUD reads them.
 * One set per run: the first render after start asks for a second, so the HUD shows real numbers straight away.
 */
function frameTimingHooks<PageModel>(frameBudgetMs: number | undefined): RuntimeLifecycleHooks<FrameModel<PageModel>> {
  let pendingTimingSnapshot: FrameTimingSnapshot | undefined;
  let needsTimingHydrationRender = true;
  return {
    beforeRender(model) {
      if (pendingTimingSnapshot == null) return model;
      return applyFrameTimingSnapshot(requireInternalFrameModel<PageModel, unknown>(model), pendingTimingSnapshot);
    },
    afterRender({ timings }) {
      pendingTimingSnapshot = summarizeFrameTimings(timings, frameBudgetMs);
      if (!needsTimingHydrationRender) return undefined;
      needsTimingHydrationRender = false;
      return { requestRender: true };
    },
  };
}

export function createHostedFrameApp<PageModel, Msg>(
  app: App<InternalFrameModel<PageModel, Msg>, FramedAppMsg<Msg>>,
  themeRuntime: FrameThemeRuntime<PageModel, Msg>,
): FramedApp<PageModel, Msg> {
  let hostedRunActive = false;
  const framedApp: FramedApp<PageModel, Msg> = {
    init: () => app.init(),
    update: (msg, model) =>
      app.update(msg, requireInternalFrameModel<PageModel, Msg>(model)),
    view: (model) =>
      app.view(requireInternalFrameModel<PageModel, Msg>(model)),
    routeRuntimeIssue: (issue) => app.routeRuntimeIssue?.(issue),
    // A host that drives the app through run() (a browser canvas) gets the same timing hooks as app.run().
    runtimeHooks: (ctx) => frameTimingHooks<PageModel>(resolveFrameBudgetMs(undefined, ctx)),
    run: runHostedFramedApp,
  };
  async function runHostedFramedApp(
    options?: FramedAppRunOptions<Msg>,
  ): Promise<void> {
    if (hostedRunActive) {
      throw new Error(
        'createFramedApp: concurrent app.run() calls on the same framed app are not supported',
      );
    }
    hostedRunActive = true;
    const themeSnapshot = themeRuntime.beginRun(options?.ctx);
    const frameBudgetMs = resolveFrameBudgetMs(
      options,
      themeRuntime.resolveContext(),
    );
    try {
      await runWithLifecycleHooks(
        framedApp,
        { ...options, mouse: options?.mouse ?? true },
        frameTimingHooks<PageModel>(frameBudgetMs),
      );
    } finally {
      hostedRunActive = false;
      themeRuntime.endRun(themeSnapshot);
    }
  }
  return framedApp;
}
