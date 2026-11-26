import { isPackedSurface, type PackedSurface, type Surface, type TimerHandle } from '@flyingrobots/bijou';
import type { SurfacePresenter } from '@flyingrobots/bijou-tui';
import type { BijouCanvasFrame, BijouCanvasPresenter } from './canvas-contract.js';
import { BijouCanvasError } from './canvas-errors.js';

/** What the bridge schedules on and where a presenter fault goes. */
export interface FrameBridgeOptions {
  /** Schedule one callback before the next repaint. */
  readonly requestFrame: (callback: () => void) => TimerHandle;
  /** A presenter threw while drawing. The bridge stops presenting after this. */
  readonly onFault: (error: unknown) => void;
}

/** The `SurfacePresenter` a canvas mount runs with, in front of a swappable presenter. */
export interface FrameBridge extends SurfacePresenter {
  /** Present to `next` from now on, starting with a full refresh of the last frame. */
  setPresenter(next: BijouCanvasPresenter | null): void;
  /**
   * Present the last frame again, in full, on the next animation frame. A
   * canvas loses its picture when its pixel size is set, and a resize that
   * leaves the grid unchanged makes the app render nothing.
   */
  refresh(): void;
  /** Cancel the pending frame and present nothing more. */
  dispose(): void;
}

interface Frame extends BijouCanvasFrame {
  sideTable: string[];
}

function packed(surface: Surface, role: string): PackedSurface {
  if (isPackedSurface(surface)) return surface;
  throw new BijouCanvasError(
    'BIJOU_WEB_CANVAS_UNPACKED_SURFACE',
    `the ${role} Surface has no packed storage, so its damage cannot reach a presenter`,
  );
}

function blankFrame(width: number, height: number, bytes: number): Frame {
  return {
    width, height,
    buffer: new Uint8Array(bytes),
    sideTable: [],
    renderDirtyWords: new Uint32Array(Math.ceil((width * height) / 32)),
  };
}

function sameGrid(a: BijouCanvasFrame | null, b: BijouCanvasFrame): boolean {
  return a !== null && a.width === b.width && a.height === b.height && a.buffer.length === b.buffer.length;
}

/**
 * Create the bridge between the TUI runtime and a canvas presenter.
 *
 * `present()` copies the target Surface's packed cells and ORs both
 * Surfaces' dirty words into one pending frame, then asks for an animation
 * frame. Every runtime frame before that animation frame lands in the same
 * pending frame, so the presenter draws once per repaint, against the frame
 * it showed last.
 */
export function createFrameBridge(options: FrameBridgeOptions): FrameBridge {
  let presenter: BijouCanvasPresenter | null = null;
  let shown: Frame | null = null;
  let pending: Frame | null = null;
  let spare: Frame | null = null;
  let force = true;
  let scheduled: TimerHandle | null = null;
  let disposed = false;

  const flush = (): void => {
    scheduled = null;
    if (disposed || presenter === null || pending === null) return;
    const target = pending;
    const refresh = force || !sameGrid(shown, target);
    try {
      presenter.present(shown ?? target, target, { forceFullRefresh: refresh });
    } catch (error: unknown) {
      disposed = true;
      options.onFault(error);
      return;
    }
    force = false;
    target.renderDirtyWords.fill(0);
    spare = shown;
    shown = target;
    pending = null;
  };
  const schedule = (): void => {
    if (scheduled === null && !disposed) scheduled = options.requestFrame(flush);
  };
  const pendingFor = (target: PackedSurface): Frame => {
    if (pending !== null && sameGrid(pending, target)) return pending;
    const reuse = spare !== null && sameGrid(spare, target) ? spare : null;
    spare = null;
    const frame = reuse ?? blankFrame(target.width, target.height, target.buffer.length);
    frame.renderDirtyWords.fill(0);
    return frame;
  };

  // Queue the newest frame for a full refresh: the pending one, or the one last shown.
  const requeue = (): void => {
    force = true;
    if (pending === null && shown !== null) {
      pending = shown;
      shown = null;
    }
    if (pending !== null) schedule();
  };

  return {
    present(current, target) {
      const from = packed(current, 'current');
      const to = packed(target, 'target');
      if (disposed) return;
      const frame = pendingFor(to);
      frame.buffer.set(to.buffer);
      frame.sideTable = [...to.sideTable];
      const words = frame.renderDirtyWords;
      for (let i = 0; i < words.length; i++) {
        words[i] = (words[i] ?? 0) | (from.renderDirtyWords[i] ?? 0) | (to.renderDirtyWords[i] ?? 0);
      }
      pending = frame;
      schedule();
    },
    setPresenter(next) {
      presenter = next;
      requeue();
    },
    refresh() {
      if (!disposed && presenter !== null) requeue();
    },
    dispose() {
      disposed = true;
      scheduled?.dispose();
      scheduled = null;
      presenter = null;
    },
  };
}
