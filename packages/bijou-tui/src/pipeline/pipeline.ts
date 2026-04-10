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

/**
 * The rendering pipeline registry.
 */
export interface RenderPipeline {
  /** Register middleware for a specific stage. */
  use(stage: RenderStage, middleware: RenderMiddleware): void;
  /** Execute the entire pipeline for a given state. */
  execute(state: RenderState): void;
}

/**
 * Create a new programmable rendering pipeline.
 */
export function createPipeline(): RenderPipeline {
  const stages: Record<RenderStage, RenderMiddleware[]> = {
    Layout: [],
    Paint: [],
    PostProcess: [],
    Diff: [],
    Output: [],
  };

  const STAGE_ORDER: RenderStage[] = ['Layout', 'Paint', 'PostProcess', 'Diff', 'Output'];

  function use(stage: RenderStage, middleware: RenderMiddleware): void {
    stages[stage].push(middleware);
  }

  function execute(state: RenderState): void {
    // Flatten all middleware into a single execution chain based on stage order
    const chain: RenderMiddleware[] = [];
    for (const stage of STAGE_ORDER) {
      chain.push(...stages[stage]);
    }

    let index = 0;

    const next = () => {
      if (index < chain.length) {
        const mw = chain[index++];
        try {
          // Note: The pipeline is currently synchronous. If a middleware returns a Promise,
          // it won't block the TEA update loop, but it might resolve out-of-order.
          // For now, we expect render middleware to be entirely synchronous.
          void mw!(state, next);
        } catch (err) {
          // Log and continue if a specific middleware fails, preventing full crash
          if (state.ctx.io.writeError) {
            state.ctx.io.writeError(`[Pipeline Error] ${err instanceof Error ? err.stack : err}\n`);
          }
          next();
        }
      }
    };

    next();
  }

  return { use, execute };
}
