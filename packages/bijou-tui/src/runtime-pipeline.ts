import {
  createPipeline,
  RENDER_LAYOUT_ROOT_KEY,
  type RenderMiddleware,
} from './pipeline/pipeline.js';
import { bcssMiddleware } from './pipeline/middleware/css.js';
import { motionMiddleware } from './pipeline/middleware/motion.js';
import { paintMiddleware } from './pipeline/middleware/paint.js';
import { renderSurfaceFrame } from './screen.js';
import type { SurfacePresenter } from './surface-presenter.js';
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
  pipeline.use('Diff', options?.presenter == null
    ? (state, next) => {
      renderSurfaceFrame(
        state.ctx.io,
        state.currentSurface,
        state.targetSurface,
        state.ctx.style,
        state.outBuf,
      );
      next();
    }
    : presentFrames(options.presenter));
  pipeline.use('Output', (state, next) => {
    buffers.adoptTarget(state.targetSurface);
    next();
  });
  options?.configurePipeline?.(pipeline);
  return pipeline;
}

/**
 * Hand each frame to the presenter in place of the ANSI differ. A thrown
 * error is fatal: the target is not adopted, because the host never showed it.
 */
function presentFrames(presenter: SurfacePresenter): RenderMiddleware {
  return (state, next) => {
    try {
      presenter.present(state.currentSurface, state.targetSurface, state.ctx);
    } catch (error) {
      state.data[FATAL_RENDER_ERROR_KEY] = error
        ?? new Error('SurfacePresenter.present() threw an empty value');
      return;
    }
    next();
  };
}
