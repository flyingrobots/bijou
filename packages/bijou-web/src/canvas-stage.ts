import type {
  BijouCanvasAbortToken, BijouCanvasBackend, BijouCanvasContainer, BijouCanvasElement, BijouCanvasTextarea,
} from './canvas-contract.js';
import { detachNode, hasFocus } from './canvas-elements.js';
import { BijouCanvasError } from './canvas-errors.js';
import type { FrameBridge } from './canvas-frames.js';
import { negotiateBackend, type LadderRequest, type LadderResult } from './canvas-ladder.js';
import type { CanvasGeometry, RetargetableSurface } from './canvas-surface.js';

/** What the stage owns besides the presenter. */
export interface CanvasStageInput<C extends BijouCanvasElement> {
  readonly container: BijouCanvasContainer;
  readonly textarea: BijouCanvasTextarea;
  readonly surface: RetargetableSurface;
  readonly bridge: FrameBridge;
  /** The ladder request of the first mount; a switch reuses it with its own choice and token. */
  readonly request: Omit<LadderRequest<C>, 'choice' | 'token'>;
  /** Called when a presenter throws outside `present()`. */
  readonly onFault: (error: unknown) => void;
}

/** The live canvas, presenter and textarea of one mount. */
export interface CanvasStage<C extends BijouCanvasElement> {
  backend(): BijouCanvasBackend;
  canvas(): C;
  /** Resize the presenter for new geometry; with `repaint`, present the last frame again. */
  apply(geometry: CanvasGeometry, repaint: boolean): void;
  /** Queue a switch; switches run one at a time. */
  switchTo(next: BijouCanvasBackend): Promise<void>;
  /** Abort pending switches and refuse new ones. Safe to call again. */
  close(): void;
  /** Close, then remove everything. Safe to call again. */
  teardown(): void;
}

/**
 * Start the stage on the first negotiated presenter. The textarea joins the
 * container; pointer input moves with the canvas through `surface`, and a
 * press on the canvas focuses the textarea. It does so on pointerdown and
 * again on pointerup: between them a browser's mousedown default action moves
 * focus off the canvas, which cannot take focus itself.
 */
export function createCanvasStage<C extends BijouCanvasElement>(
  input: CanvasStageInput<C>,
  first: LadderResult<C>,
): CanvasStage<C> {
  const { container, textarea, surface, bridge } = input;
  let live: LadderResult<C> = first;
  let queue: Promise<void> = Promise.resolve();
  let closed = false;
  let released = false;
  const pending = new Set<{ aborted: boolean }>();
  const focusTextarea = (): void => { textarea.focus(); };
  const close = (): void => {
    closed = true;
    for (const token of pending) token.aborted = true;
  };

  container.appendChild(textarea);
  surface.addEventListener('pointerdown', focusTextarea);
  surface.addEventListener('pointerup', focusTextarea);
  surface.retarget(first.canvas);
  bridge.setPresenter(first.presenter);

  const swap = (next: LadderResult<C>): void => {
    const focused = hasFocus(container, textarea);
    const old = live;
    live = next;
    surface.retarget(next.canvas);
    bridge.setPresenter(next.presenter);
    old.presenter.dispose();
    detachNode(container, old.canvas);
    if (focused && !hasFocus(container, textarea)) textarea.focus();
  };
  const run = async (next: BijouCanvasBackend): Promise<void> => {
    if (closed) throw new BijouCanvasError('BIJOU_WEB_CANVAS_STOPPED', 'switchBackend() was called after stop()');
    const token: BijouCanvasAbortToken & { aborted: boolean } = { aborted: false };
    pending.add(token);
    try {
      swap(await negotiateBackend({ ...input.request, choice: next, token }));
    } finally {
      pending.delete(token);
    }
  };

  return {
    backend: () => live.backend,
    canvas: () => live.canvas,
    apply(geometry, repaint) {
      try {
        live.presenter.resize(geometry.size);
      } catch (error: unknown) {
        input.onFault(error);
        return;
      }
      // Setting a canvas's size clears it. With the grid unchanged the app renders
      // nothing, so the last frame is painted again; a new grid brings its own frame.
      if (repaint) bridge.refresh();
    },
    switchTo(next) {
      const result = queue.then(() => run(next));
      queue = result.catch(() => undefined);
      return result;
    },
    close,
    teardown() {
      close();
      if (released) return;
      released = true;
      bridge.dispose();
      surface.removeEventListener('pointerdown', focusTextarea);
      surface.removeEventListener('pointerup', focusTextarea);
      surface.retarget(null);
      live.presenter.dispose();
      detachNode(container, live.canvas);
      detachNode(container, textarea);
    },
  };
}
