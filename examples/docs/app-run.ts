import type { BijouContext } from '../../packages/bijou/src/index.js';
import {
  summarizeFrameTimings,
  type FrameTimingSnapshot,
  type RenderStageTiming,
  type RunOptions,
} from '../../packages/bijou-tui/src/index.js';
import { runWithLifecycleHooks } from '../../packages/bijou-tui/src/runtime.js';
import type {
  DocsAppOptions,
  RootModel,
  RootMsg,
} from './app-model.js';
import { createDocsApp } from './app-root.js';

export async function runDocsApp(
  context: BijouContext,
  options: DocsAppOptions = {},
  runOptions: RunOptions<RootMsg> = {},
): Promise<void> {
  const app = createDocsApp(context, options);
  const runtimeContext = runOptions.ctx ?? context;
  const frameBudgetMs = resolveRootFrameBudgetMs(runtimeContext);
  let pendingSnapshot: FrameTimingSnapshot | undefined;
  let needsHydrationRender = true;
  await runWithLifecycleHooks(
    app,
    { ...runOptions, ctx: runtimeContext },
    {
      beforeRender(model) {
        return pendingSnapshot == null
          ? model
          : applyRootFrameTimingSnapshot(model, pendingSnapshot);
      },
      afterRender({
        timings,
      }: {
        timings: readonly RenderStageTiming[];
      }) {
        pendingSnapshot = summarizeFrameTimings(
          timings,
          frameBudgetMs,
        );
        if (!needsHydrationRender) return;
        needsHydrationRender = false;
        return { requestRender: true };
      },
    },
  );
}

function applyRootFrameTimingSnapshot(
  model: RootModel,
  snapshot: FrameTimingSnapshot,
): RootModel {
  const docs = model.docsModel;
  if (
    docs.frameTimeMs === snapshot.frameTimeMs &&
    docs.viewTimeMs === snapshot.viewTimeMs &&
    docs.diffTimeMs === snapshot.diffTimeMs &&
    docs.frameBudgetMs === snapshot.frameBudgetMs &&
    docs.frameOverBudget === snapshot.frameOverBudget
  ) {
    return model;
  }
  return {
    ...model,
    docsModel: {
      ...docs,
      frameTimeMs: snapshot.frameTimeMs,
      viewTimeMs: snapshot.viewTimeMs,
      diffTimeMs: snapshot.diffTimeMs,
      frameBudgetMs: snapshot.frameBudgetMs,
      frameOverBudget: snapshot.frameOverBudget,
    },
  };
}

function resolveRootFrameBudgetMs(
  context: BijouContext,
): number | undefined {
  const refreshRate = context.runtime.refreshRate;
  return Number.isFinite(refreshRate) && refreshRate > 0
    ? 1_000 / refreshRate
    : undefined;
}
