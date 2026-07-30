import type { TimerHandle } from '@flyingrobots/bijou';
import {
  getRenderStageTimings,
  type RenderState,
} from './pipeline/pipeline.js';
import { evaluateSurfaceBudget } from './surface-budget.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import type {
  InteractiveRuntimeInput,
  RuntimeRenderer,
} from './runtime-contract.js';
import {
  createRuntimePipeline,
  FATAL_RENDER_ERROR_KEY,
} from './runtime-pipeline.js';

/** Schedule coalesced renders against one shared runtime session. */
export function createRuntimeRenderer<Model, M>(
  input: InteractiveRuntimeInput<Model, M>,
  buffers: RuntimeFramebuffers,
): RuntimeRenderer {
  const { session, clock, options, ctx } = input;
  const pipeline = createRuntimePipeline(
    input.app,
    options,
    session,
    buffers,
    input.runtimeViewport,
  );
  const routedWarnings = new Set<string>();
  const schedule = (): void => {
    if (session.renderHandle != null || session.renderInFlight) return;
    const handle: TimerHandle = clock.setTimeout(() => {
      if (session.renderHandle === handle) session.renderHandle = null;
      handle.dispose();
      if (!session.renderQueued) return;
      session.renderInFlight = true;
      session.renderQueued = false;
      try {
        const before = input.hooks?.beforeRender?.(session.model);
        if (before !== undefined) session.model = before;
        const viewport = input.runtimeViewport();
        buffers.ensure(viewport.columns, viewport.rows);
        buffers.next.clear();
        const state: RenderState = {
          model: session.model,
          ctx,
          dt: session.currentDt,
          currentSurface: buffers.current,
          targetSurface: buffers.next,
          outBuf: buffers.output,
          layoutMap: new Map(),
          data: {},
        };
        pipeline.execute(state);
        const fatal = state.data[FATAL_RENDER_ERROR_KEY];
        if (fatal !== undefined) {
          input.crash('render', fatal, session.model);
          return;
        }
        const timings = getRenderStageTimings(state);
        if (options?.surfaceBudget != null) {
          for (const warning of evaluateSurfaceBudget({
            surface: state.targetSurface,
            timings,
            thresholds: options.surfaceBudget,
          })) {
            if (routedWarnings.has(warning.message)) continue;
            routedWarnings.add(warning.message);
            input.routeRuntimeIssue({
              level: 'warning',
              source: 'runtime',
              message: warning.message,
              atMs: clock.now(),
            });
          }
        }
        const after = input.hooks?.afterRender?.({
          model: session.model,
          dt: session.currentDt,
          timings,
          viewport,
        });
        if (after?.model !== undefined) session.model = after.model;
        if (after?.requestRender === true) render();
      } catch (error) {
        input.crash('render', error, session.model);
      } finally {
        session.renderInFlight = false;
        scheduleQueuedRender(session, schedule);
      }
    }, 0);
    session.renderHandle = handle;
  };
  const render = (): void => {
    if (!session.running) return;
    session.renderQueued = true;
    schedule();
  };
  return {
    render,
    hasPendingRender: () =>
      session.renderHandle != null || session.renderInFlight,
    dispose() {
      session.renderHandle?.dispose();
      session.renderHandle = null;
    },
  };
}

function scheduleQueuedRender(
  session: { readonly renderQueued: boolean },
  schedule: () => void,
): void {
  if (session.renderQueued) schedule();
}
