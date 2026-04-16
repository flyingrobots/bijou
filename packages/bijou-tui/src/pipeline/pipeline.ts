import type { Surface, BijouContext } from '@flyingrobots/bijou';

/**
 * The state passed through the rendering pipeline.
 */
export interface RenderState {
  /** The model being rendered. */
  model: any;
  /** The Bijou context (ports, theme, mode). */
  ctx: BijouContext;
  /** Time delta in seconds since the last frame. */
  dt: number;
  /**
   * The surface currently visible on the terminal.
   * This should NOT be modified by pipeline stages.
   */
  readonly currentSurface: Surface;
  /**
   * The target surface being painted.
   * Middleware in the `Paint` and `PostProcess` stages modify this surface.
   */
  targetSurface: Surface;
  /**
   * Pooled byte buffer owned by the runtime for direct UTF-8 emission
   * from the Diff stage. The buffer is sized to the current viewport and
   * reused across frames. Absent only in non-interactive modes or custom
   * pipelines that do not drive the default Diff middleware.
   */
  outBuf?: Uint8Array;
  /**
   * Layout geometry calculated during the `Layout` stage.
   * Keyed by component ID.
   */
  layoutMap: Map<string, any>;
  /**
   * Custom data bag for middleware to pass state between stages.
   */
  data: Record<string, any>;
}

/**
 * A middleware function in the rendering pipeline.
 *
 * @param state - The current render state.
 * @param next - Function to yield control to the next middleware.
 */
export type RenderMiddleware = (state: RenderState, next: () => void) => void | Promise<void>;

/**
 * A stage in the rendering pipeline.
 */
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

/**
 * Read per-stage timings captured during the current pipeline execution.
 *
 * The returned array is replaced on each `pipeline.execute(state)` call.
 */
export function getRenderStageTimings(state: Pick<RenderState, 'data'>): readonly RenderStageTiming[] {
  const timings = state.data[RENDER_STAGE_TIMINGS_KEY];
  return Array.isArray(timings) ? timings as readonly RenderStageTiming[] : [];
}

/**
 * The rendering pipeline registry.
 */
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

  const STAGE_ORDER: RenderStage[] = ['Layout', 'Paint', 'PostProcess', 'Diff', 'Output'];
  type StagePlanEntry = {
    stage: RenderStage;
    middlewares: readonly RenderMiddleware[];
  };
  let cachedPlan: StagePlanEntry[] = [];
  let chainDirty = true;
  const readNow = options.now ?? (() => globalThis.performance?.now?.() ?? Date.now());

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
        if (state.ctx.io.writeError) {
          state.ctx.io.writeError(`[Pipeline Observer Error] ${err instanceof Error ? err.stack : err}\n`);
        }
      }
    }
  }

  function execute(state: RenderState): void {
    const plan = getExecutionPlan();
    const timings: RenderStageTiming[] = [];
    state.data[RENDER_STAGE_TIMINGS_KEY] = timings;

    const runStage = (stageIndex: number, middlewareIndex: number, stageStartMs: number): void => {
      if (stageIndex >= plan.length) return;

      const entry = plan[stageIndex]!;
      if (middlewareIndex >= entry.middlewares.length) {
        recordStageTiming(state, timings, entry.stage, readNow() - stageStartMs);
        runStage(stageIndex + 1, 0, readNow());
        return;
      }

      const middleware = entry.middlewares[middlewareIndex]!;
      let advanced = false;
      const next = () => {
        if (advanced) return;
        advanced = true;
        runStage(stageIndex, middlewareIndex + 1, stageStartMs);
      };

      try {
        // Note: The pipeline is currently synchronous. If a middleware returns a Promise,
        // it won't block the TEA update loop, but it might resolve out-of-order.
        // For now, we expect render middleware to be entirely synchronous.
        void middleware(state, next);
      } catch (err) {
        // Log and continue if a specific middleware fails, preventing full crash
        if (state.ctx.io.writeError) {
          state.ctx.io.writeError(`[Pipeline Error] ${err instanceof Error ? err.stack : err}\n`);
        }
        next();
      }

      // A middleware that does not call next() halts the pipeline. Record the
      // current stage timing so callers can still observe partial execution.
      if (!advanced) {
        recordStageTiming(state, timings, entry.stage, readNow() - stageStartMs);
      }
    };

    runStage(0, 0, readNow());
  }

  return { use, onStageComplete, execute };
}
