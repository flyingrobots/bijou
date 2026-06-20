import type { Surface, BijouContext, LayoutNode } from '@flyingrobots/bijou';

export interface RenderState {
  model: unknown;
  ctx: BijouContext;
  dt: number;
  readonly currentSurface: Surface;
  targetSurface: Surface;
  /** Pooled byte buffer owned by the runtime for direct UTF-8 emission. */
  outBuf?: Uint8Array;
  layoutMap: Map<string, unknown>;
  data: Record<string, unknown>;
}

export type RenderMiddleware = (state: RenderState, next: () => void) => void | Promise<void>;

export type RenderStage = 'Layout' | 'Paint' | 'PostProcess' | 'Diff' | 'Output';

/** Per-stage timing sample captured during a single pipeline execution. */
export interface RenderStageTiming {
  /** Stage that completed. */
  readonly stage: RenderStage;
  /** Wall-clock duration for this stage in milliseconds. */
  readonly durationMs: number;
}

/** Observer notified whenever a render stage completes. */
export type RenderStageCompleteHandler = (
  stage: RenderStage,
  durationMs: number,
  state: RenderState,
) => void;

/** Disposable observer registration handle. */
export interface RenderStageObserver {
  dispose(): void;
}

/** Key used to store per-frame stage timings in `RenderState.data`. */
export const RENDER_STAGE_TIMINGS_KEY = '__pipelineStageTimings';

/** Key used to pass the resolved layout root between middleware stages. */
export const RENDER_LAYOUT_ROOT_KEY = '__bijou:layoutRoot';

export function getRenderLayoutRoot(state: Pick<RenderState, 'data'>): LayoutNode | undefined {
  const root = state.data[RENDER_LAYOUT_ROOT_KEY];
  return isLayoutNode(root) ? root : undefined;
}

export function getRenderStageTimings(state: Pick<RenderState, 'data'>): readonly RenderStageTiming[] {
  const timings = state.data[RENDER_STAGE_TIMINGS_KEY];
  return Array.isArray(timings) ? timings as readonly RenderStageTiming[] : [];
}

export interface RenderPipeline {
  /** Register middleware for a specific stage. */
  use(stage: RenderStage, middleware: RenderMiddleware): void;
  /** Observe per-stage completion timings for each pipeline execution. */
  onStageComplete(handler: RenderStageCompleteHandler): RenderStageObserver;
  /** Execute the entire pipeline for a given state. */
  execute(state: RenderState): void;
}

/** Options for creating a programmable render pipeline. */
export interface CreatePipelineOptions {
  /** Optional timing source override, primarily for deterministic tests. */
  now?: () => number;
  /** Optional diagnostic hook invoked when the stage plan cache is rebuilt. */
  onPlanRebuild?: () => void;
}

function isLayoutNode(value: unknown): value is LayoutNode {
  return typeof value === 'object' && value !== null && 'rect' in value && 'children' in value;
}

interface ThenableCandidate {
  then: unknown;
}

function isThenableCandidate(value: unknown): value is ThenableCandidate {
  return (typeof value === 'object' || typeof value === 'function')
    && value !== null
    && 'then' in value;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isThenableCandidate(value) && typeof value.then === 'function';
}

function formatUnknownDetail(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (value == null || typeof value !== 'object') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

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
      options.onPlanRebuild?.();
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

  function writePipelineError(state: RenderState, message: string, detail?: unknown): void {
    const suffix = detail == null
      ? ''
      : detail instanceof Error
        ? ` ${detail.stack ?? detail.message}`
        : ` ${formatUnknownDetail(detail)}`;
    state.ctx.io.writeError(`${message}${suffix}\n`);
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
