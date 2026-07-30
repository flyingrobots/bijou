import type { BijouContext } from '@flyingrobots/bijou';
import type {
  FramedAppRunOptions,
  InternalFrameModel,
} from './app-frame-types.js';
import type { FrameTimingSnapshot } from './app-frame-performance.js';

export function applyFrameTimingSnapshot<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  snapshot: FrameTimingSnapshot,
): InternalFrameModel<PageModel, Msg> {
  if (
    model.frameTimeMs === snapshot.frameTimeMs &&
    model.viewTimeMs === snapshot.viewTimeMs &&
    model.diffTimeMs === snapshot.diffTimeMs &&
    model.frameBudgetMs === snapshot.frameBudgetMs &&
    model.frameOverBudget === snapshot.frameOverBudget
  ) {
    return model;
  }
  return {
    ...model,
    frameTimeMs: snapshot.frameTimeMs,
    viewTimeMs: snapshot.viewTimeMs,
    diffTimeMs: snapshot.diffTimeMs,
    frameBudgetMs: snapshot.frameBudgetMs,
    frameOverBudget: snapshot.frameOverBudget,
  };
}

export function resolveFrameBudgetMs<Msg>(
  runOptions: FramedAppRunOptions<Msg> | undefined,
  fallbackCtx: BijouContext | undefined,
): number | undefined {
  if (runOptions?.frameBudgetMs != null) return runOptions.frameBudgetMs;
  const refreshRate =
    runOptions?.ctx?.runtime.refreshRate ??
    fallbackCtx?.runtime.refreshRate;
  if (
    refreshRate == null ||
    !Number.isFinite(refreshRate) ||
    refreshRate <= 0
  ) {
    return undefined;
  }
  return 1_000 / refreshRate;
}
