import type { BijouCanvasBox, BijouCanvasContainer, BijouCanvasHost } from './canvas-contract.js';
import { abortedError } from './canvas-errors.js';
import type { BijouCanvasAbortSignal } from './canvas-options.js';
import { canvasGeometry, hasArea, type CanvasGeometry, type CellPx } from './canvas-surface.js';

/** The container's latest geometry, and a promise for the first one with area. */
export interface CanvasWatch {
  /** Set once `stop()` or the mount signal fires. */
  readonly token: { aborted: boolean };
  /** `null` until the container has had a box with area. */
  geometry(): CanvasGeometry | null;
  /** Resolves on the first box with area; rejects when the signal aborts first. */
  firstArea(): Promise<CanvasGeometry>;
  /** Receive every later geometry. */
  onChange(listener: (geometry: CanvasGeometry) => void): void;
  /** Stop listening to the signal; observation continues. */
  releaseSignal(): void;
  /** Stop observing. Safe to call again. */
  dispose(): void;
}

/**
 * Observe the container's box and the device pixel ratio. A box with zero
 * width or height is ignored, so a hidden container defers the mount and a
 * mounted canvas keeps its last size.
 */
export function watchCanvasBox(
  container: BijouCanvasContainer,
  host: BijouCanvasHost,
  cellPx: CellPx,
  signal: BijouCanvasAbortSignal | undefined,
): CanvasWatch {
  const token = { aborted: false };
  let geometry: CanvasGeometry | null = null;
  let lastBox: BijouCanvasBox | undefined;
  let listener: ((geometry: CanvasGeometry) => void) | undefined;
  let arrive: (geometry: CanvasGeometry) => void = () => undefined;
  let refuse: (error: Error) => void = () => undefined;
  const first = new Promise<CanvasGeometry>((resolve, reject) => { arrive = resolve; refuse = reject; });
  const update = (box: BijouCanvasBox): void => {
    if (!hasArea(box)) return;
    lastBox = box;
    geometry = canvasGeometry(box, host.devicePixelRatio(), cellPx);
    arrive(geometry);
    listener?.(geometry);
  };
  const onAbort = (): void => {
    token.aborted = true;
    refuse(abortedError());
  };
  const stopObserving = host.observeResize(container, update);
  const stopDpr = host.watchDevicePixelRatio(() => { if (lastBox !== undefined) update(lastBox); });
  signal?.addEventListener('abort', onAbort);
  let disposed = false;
  const releaseSignal = (): void => { signal?.removeEventListener('abort', onAbort); };
  return {
    token,
    geometry: () => geometry,
    firstArea: () => first,
    onChange(next) { listener = next; },
    releaseSignal,
    dispose() {
      releaseSignal();
      if (disposed) return;
      disposed = true;
      stopObserving();
      stopDpr();
    },
  };
}
