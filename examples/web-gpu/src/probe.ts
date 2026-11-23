import type { HudState } from './hud.js';
import type { ShowcaseSession } from './session.js';

/** What the browser suite reads and drives through `window.__bijouWebGpu`. */
export interface ShowcaseProbe {
  readonly ready: true;
  state(): Promise<HudState>;
  model(): unknown;
  /** RGBA of every displayed pixel of one cell, read back from the canvas the page shows. */
  cellPixels(col: number, row: number): number[] | null;
  cellRect(col: number, row: number): { x: number; y: number; width: number; height: number };
  /** Every queued operation that failed, oldest first. */
  failures(): readonly string[];
  mountApp: ShowcaseSession['mountApp'];
  switchBackend: ShowcaseSession['switchBackend'];
  loseContext: ShowcaseSession['loseContext'];
  resetAtlas: ShowcaseSession['resetAtlas'];
  unmount: ShowcaseSession['unmount'];
}

declare global {
  interface Window {
    __bijouWebGpu?: ShowcaseProbe;
    __bijouWebGpuError?: string;
  }
}

/**
 * Draw the presented canvas onto a scratch 2D canvas and read one cell. The
 * pixels are what the canvas shows: WebGL2 keeps its drawing buffer, and
 * Canvas 2D holds its own.
 */
function readCell(session: ShowcaseSession, col: number, row: number): number[] | null {
  const canvas = session.handle()?.canvas;
  if (canvas == null || canvas.width === 0) return null;
  const scratch = document.createElement('canvas');
  scratch.width = canvas.width;
  scratch.height = canvas.height;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (context === null) return null;
  context.drawImage(canvas, 0, 0);
  // The mount's fixed cell size: the canvas is not rounded to whole cells.
  const { width, height } = session.cellPx();
  return [...context.getImageData(col * width, row * height, width, height).data];
}

/** The canvas rectangle `cellPixels()` reads for one cell, in physical pixels. */
function cellRect(session: ShowcaseSession, col: number, row: number): { x: number; y: number; width: number; height: number } {
  const { width, height } = session.cellPx();
  return { x: col * width, y: row * height, width, height };
}

export function installProbe(session: ShowcaseSession): void {
  window.__bijouWebGpu = {
    ready: true,
    state: () => session.state(),
    model: () => session.model(),
    cellPixels: (col, row) => readCell(session, col, row),
    cellRect: (col, row) => cellRect(session, col, row),
    failures: () => session.failures(),
    mountApp: (id, backend) => session.mountApp(id, backend),
    switchBackend: (next) => session.switchBackend(next),
    loseContext: () => session.loseContext(),
    resetAtlas: () => session.resetAtlas(),
    unmount: () => session.unmount(),
  };
}
