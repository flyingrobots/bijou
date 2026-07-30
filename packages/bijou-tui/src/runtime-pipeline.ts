import {
  createPipeline,
  RENDER_LAYOUT_ROOT_KEY,
} from './pipeline/pipeline.js';
import { bcssMiddleware } from './pipeline/middleware/css.js';
import { motionMiddleware } from './pipeline/middleware/motion.js';
import { paintMiddleware } from './pipeline/middleware/paint.js';
import { renderSurfaceFrame } from './screen.js';
import type {
  App,
  RunOptions,
} from './types.js';
import { wrapViewOutputAsLayoutRoot } from './view-output.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import type { RuntimeSession } from './runtime-contract.js';

export const FATAL_RENDER_ERROR_KEY = '__fatalRenderError';

/** Build the programmable render pipeline around shared framebuffers. */
export function createRuntimePipeline<Model, M>(
  app: App<Model, M>,
  options: RunOptions<M> | undefined,
  session: RuntimeSession<Model>,
  buffers: RuntimeFramebuffers,
  viewport: () => { columns: number; rows: number },
): ReturnType<typeof createPipeline> {
  const pipeline = createPipeline();
  pipeline.use('Layout', (state, next) => {
    try {
      const size = viewport();
      state.data[RENDER_LAYOUT_ROOT_KEY] = wrapViewOutputAsLayoutRoot(
        app.view(session.model),
        { width: size.columns, height: size.rows },
      );
      next();
    } catch (error) {
      state.data[FATAL_RENDER_ERROR_KEY] = error;
    }
  });
  pipeline.use('Layout', motionMiddleware());
  if (options?.css != null) {
    pipeline.use('Layout', bcssMiddleware(options.css));
  }
  pipeline.use('Paint', paintMiddleware());
  pipeline.use('Diff', (state, next) => {
    renderSurfaceFrame(
      state.ctx.io,
      state.currentSurface,
      state.targetSurface,
      state.ctx.style,
      state.outBuf,
    );
    next();
  });
  pipeline.use('Output', (_state, next) => {
    buffers.swap();
    next();
  });
  options?.configurePipeline?.(pipeline);
  return pipeline;
}
