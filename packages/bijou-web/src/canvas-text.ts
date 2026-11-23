import { BijouCanvasError } from './canvas-errors.js';
import type { WebInteractiveContext } from './context-interactive.js';
import type { MountedBijouCanvas } from './canvas-options.js';

/**
 * Run an app in a lowered output mode. The runtime writes one text frame to
 * the context's output sinks; no canvas, textarea or presenter is created.
 * Interactive web accessibility belongs to the DOM host, not to a canvas.
 */
export function runTextMount<Model>(
  running: Promise<void>,
  model: () => Model,
  ctx: WebInteractiveContext,
): MountedBijouCanvas<Model, never> {
  const done = running.finally(() => { ctx.io.dispose(); });
  const settled = done.catch(() => undefined);
  return {
    backend: null,
    fallbackReasons: [],
    canvas: null,
    textarea: null,
    ctx,
    done,
    model,
    cellFromPoint: (clientX, clientY) => ctx.io.cellFromPoint(clientX, clientY),
    switchBackend: () => Promise.reject(new BijouCanvasError(
      'BIJOU_WEB_CANVAS_NOT_INTERACTIVE',
      `the ${ctx.mode} output mode presents no canvas, so there is no backend to switch`,
    )),
    stop: () => settled,
  };
}
