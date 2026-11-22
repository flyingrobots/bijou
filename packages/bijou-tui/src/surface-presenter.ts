import type { BijouContext, Surface } from '@flyingrobots/bijou';

/**
 * Host seam that receives each `interactive` frame as a pair of Surfaces
 * instead of an ANSI byte stream.
 *
 * Pass a presenter through `RunOptions.presenter`. While it is set, the
 * runtime writes no frame, screen, cursor or mouse escape sequences to
 * `ctx.io`: it calls the presenter instead. Runtime diagnostics still go to
 * the context error port. The `static`, `pipe` and `accessible` output modes
 * ignore the presenter and keep their text lowering through `ctx.io.write()`.
 *
 * The contract uses only Bijou types. It names no browser, DOM, GPU or Node
 * type, so a host adapter owns every platform dependency.
 *
 * Not part of this version of the contract:
 *
 * - Hardware cursor overlay. The runtime reports no cursor position or
 *   visibility to the presenter.
 * - OSC 8 hyperlinks. No link side channel accompanies a frame.
 * - Window title. The runtime sends no title side channel.
 */
export interface SurfacePresenter {
  /**
   * Present one frame. This call is strictly synchronous.
   *
   * `current` is the frame that the host shows now and `target` is the frame
   * to show next. Both are live runtime framebuffers: the runtime swaps and
   * reuses them as soon as this method returns. Read, copy or upload every
   * cell and side-table string that you need before you return, and do not
   * keep a reference to either Surface. Do not mutate them.
   *
   * For packed Surfaces, the union of `current.renderDirtyWords` and
   * `target.renderDirtyWords` marks every cell that can differ, including a
   * cell that `current` painted and `target` leaves empty. After a resize,
   * `current` is an invalidated frame at the new size, so every cell is
   * marked.
   *
   * A thrown error puts the runtime in crash mode. The runtime then presents
   * the crash Surface through this method. If that call also throws, `run()`
   * rejects with the first error.
   *
   * @param current - The frame that the host shows now.
   * @param target - The frame to show next.
   * @param ctx - The Bijou context of the run.
   */
  present(current: Surface, target: Surface, ctx: BijouContext): void;

  /**
   * Called once before the first frame, in place of the alternate screen,
   * cursor and mouse escape sequences. An error here rejects `run()`.
   */
  enter?(): void;

  /**
   * Called once after the last frame, when the runtime shuts down or after a
   * crash, in place of the escape sequences that restore the terminal.
   */
  exit?(): void;

  /**
   * Called when the viewport size changes, before the frame at the new size,
   * in place of the escape sequence that clears the terminal. The runtime
   * reports a thrown error as a runtime issue and continues.
   *
   * @param cols - New viewport width in cells.
   * @param rows - New viewport height in cells.
   */
  onResize?(cols: number, rows: number): void;
}
