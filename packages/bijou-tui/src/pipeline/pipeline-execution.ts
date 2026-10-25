import type {
  CreatePipelineOptions,
  RenderMiddleware,
  RenderPipeline,
  RenderStage,
  RenderStageCompleteHandler,
  RenderStageObserver,
  RenderStageTiming,
  RenderState,
} from './pipeline.js';
import { RENDER_STAGE_TIMINGS_KEY } from './pipeline-keys.js';
import { formatUnknownDetail, isPromiseLike, writePipelineError } from './pipeline-diagnostics.js';

/**
 * Create a new programmable rendering pipeline.
 */
export function createPipeline(options: CreatePipelineOptions = {}): RenderPipeline {
  const stages: Record<RenderStage, RenderMiddleware[]> = {
    Layout: [],
    Paint: [],
    PostProcess: [],
    Diff: [],
    Output: [],
  };
  const stageCompleteHandlers = new Set<RenderStageCompleteHandler>();
  const warnedAsyncMiddleware = new WeakSet<RenderMiddleware>();

  const STAGE_ORDER: RenderStage[] = ['Layout', 'Paint', 'PostProcess', 'Diff', 'Output'];
  interface StagePlanEntry {
    stage: RenderStage;
    middlewares: readonly RenderMiddleware[];
  }
  let cachedPlan: StagePlanEntry[] = [];
  let chainDirty = true;
  const readNow = options.now ?? (() => globalThis.performance.now());

  function use(stage: RenderStage, middleware: RenderMiddleware): void {
    stages[stage].push(middleware);
    chainDirty = true;
  }

  function onStageComplete(handler: RenderStageCompleteHandler): RenderStageObserver {
    stageCompleteHandlers.add(handler);
    return {
      dispose(): void {
        stageCompleteHandlers.delete(handler);
      },
    };
  }

  function getExecutionPlan(): StagePlanEntry[] {
    if (chainDirty) {
      cachedPlan = STAGE_ORDER.map((stage) => ({
        stage,
        middlewares: stages[stage],
      }));
      chainDirty = false;
      try { options.onPlanRebuild?.(); } catch { /* diag only */ }
    }

    return cachedPlan;
  }

  function recordStageTiming(
    state: RenderState,
    timings: RenderStageTiming[],
    stage: RenderStage,
    durationMs: number,
  ): void {
    const timing: RenderStageTiming = { stage, durationMs };
    timings.push(timing);

    for (const handler of stageCompleteHandlers) {
      try {
        handler(stage, durationMs, state);
      } catch (err) {
        state.ctx.io.writeError(`[Pipeline Observer Error] ${formatUnknownDetail(err)}\n`);
      }
    }
  }

  function execute(state: RenderState): void {
    const plan = getExecutionPlan();
    const timings: RenderStageTiming[] = [];
    state.data[RENDER_STAGE_TIMINGS_KEY] = timings;

    const runStage = (stageIndex: number, middlewareIndex: number, stageStartMs: number): void => {
      if (stageIndex >= plan.length) return;

      const entry = plan[stageIndex];
      if (entry === undefined) return;
      if (middlewareIndex >= entry.middlewares.length) {
        recordStageTiming(state, timings, entry.stage, readNow() - stageStartMs);
        runStage(stageIndex + 1, 0, readNow());
        return;
      }

      const middleware = entry.middlewares[middlewareIndex];
      if (middleware === undefined) return;
      let advanced = false;
      const hasAdvanced = () => advanced;
      const next = () => {
        if (advanced) return;
        advanced = true;
        runStage(stageIndex, middlewareIndex + 1, stageStartMs);
      };

      try {
        const result = middleware(state, next);

        if (isPromiseLike(result)) {
          if (!warnedAsyncMiddleware.has(middleware)) {
            warnedAsyncMiddleware.add(middleware);
            writePipelineError(
              state,
              `[Pipeline Error] Async render middleware returned a Promise in ${entry.stage}; render middleware must be synchronous. Move async work into Cmd/Msg round trips.`,
            );
          }

          Promise.resolve(result).catch((err: unknown) => {
            writePipelineError(
              state,
              `[Pipeline Error] Async render middleware rejected in ${entry.stage}:`,
              err,
            );
          });

          // Async middleware is unsupported because it can resume out of frame
          // order. Keep the current frame moving and let the guarded `next`
          // ignore any late continuation.
          next();
        }
      } catch (err) {
        // Log and continue if a specific middleware fails, preventing full crash
        writePipelineError(state, '[Pipeline Error]', err);
        next();
      }

      if (!hasAdvanced()) {
        recordStageTiming(state, timings, entry.stage, readNow() - stageStartMs);
      }
    };
    runStage(0, 0, readNow());
  }
  return { use, onStageComplete, execute };
}
