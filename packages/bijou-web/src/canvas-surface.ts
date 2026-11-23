import type { BijouCanvasBox, BijouCanvasElement, BijouCanvasResize } from './canvas-contract.js';
import type { WebGridSize } from './pointer.js';
import type { WebListenerOptions, WebPointerEvent, WebPointerSurface, WebRect } from './web-dom.js';

/** Physical pixels per cell. */
export interface CellPx {
  readonly width: number;
  readonly height: number;
}

/** A resize plus the grid and physical canvas size it gives. */
export interface CanvasGeometry {
  readonly size: BijouCanvasResize;
  readonly grid: WebGridSize;
  readonly canvasPx: { readonly width: number; readonly height: number };
  readonly cellPx: CellPx;
}

/**
 * The grid a box holds: physical size divided by the cell size, floored, as
 * Geordi's `presenterGridGeometry()` computes it. The physical size is the
 * device-pixel content box when observed, else `round(css * dpr)`.
 */
export function canvasGeometry(box: BijouCanvasBox, dpr: number, cellPx: CellPx): CanvasGeometry {
  const device = box.devicePixelContentBox;
  const canvasPx = device ?? {
    width: Math.max(1, Math.round(box.cssWidth * dpr)),
    height: Math.max(1, Math.round(box.cssHeight * dpr)),
  };
  const size: BijouCanvasResize = device === undefined
    ? { cssWidth: box.cssWidth, cssHeight: box.cssHeight, dpr }
    : { cssWidth: box.cssWidth, cssHeight: box.cssHeight, dpr, devicePixelContentBox: device };
  return {
    size,
    canvasPx,
    cellPx,
    grid: {
      columns: Math.max(1, Math.floor(canvasPx.width / cellPx.width)),
      rows: Math.max(1, Math.floor(canvasPx.height / cellPx.height)),
    },
  };
}

/** Whether a box has area. A zero box defers the mount. */
export function hasArea(box: BijouCanvasBox): boolean {
  return box.cssWidth > 0 && box.cssHeight > 0;
}

interface Registration {
  readonly type: string;
  readonly listener: (event: WebPointerEvent) => void;
  readonly options: WebListenerOptions | undefined;
}

/** A pointer surface that stays registered with the input adapter while its canvas changes. */
export interface RetargetableSurface extends WebPointerSurface {
  /** Move every listener from the current canvas to `next`, or remove them all with `null`. */
  retarget(next: BijouCanvasElement | null): void;
}

/**
 * Create the surface the input adapter binds to. Its rect covers only the
 * whole cells, so `cellAt()` divides by the cell size exactly as a Geordi
 * presenter's `cellFromPoint()` does, even when the canvas has spare pixels.
 */
export function createRetargetableSurface(geometry: () => CanvasGeometry | null): RetargetableSurface {
  const registrations: Registration[] = [];
  let canvas: BijouCanvasElement | null = null;
  return {
    addEventListener(type, listener, options) {
      registrations.push({ type, listener, options });
      canvas?.addEventListener(type, listener, options);
    },
    removeEventListener(type, listener) {
      const index = registrations.findIndex((entry) => entry.type === type && entry.listener === listener);
      if (index >= 0) registrations.splice(index, 1);
      canvas?.removeEventListener(type, listener);
    },
    getBoundingClientRect(): WebRect {
      const rect = canvas?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
      const shape = geometry();
      if (shape === null) return rect;
      const used = (cells: number, cellPx: number, total: number): number => Math.min(1, (cells * cellPx) / total);
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width * used(shape.grid.columns, shape.cellPx.width, shape.canvasPx.width),
        height: rect.height * used(shape.grid.rows, shape.cellPx.height, shape.canvasPx.height),
      };
    },
    retarget(next) {
      for (const entry of registrations) canvas?.removeEventListener(entry.type, entry.listener);
      canvas = next;
      for (const entry of registrations) canvas?.addEventListener(entry.type, entry.listener, entry.options);
    },
  };
}
