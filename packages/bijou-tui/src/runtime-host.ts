import type { BijouContext, Surface } from '@flyingrobots/bijou';
import {
  DISABLE_MOUSE,
  mouseModeSequence,
  resolveMouseMode,
} from './mouse-mode.js';
import {
  clearAndHome,
  enterScreen,
  exitScreen,
  renderSurfaceFrame,
} from './screen.js';
import type { SurfacePresenter } from './surface-presenter.js';
import type { RunOptions } from './types.js';

/** Where the interactive runtime sends lifecycle signals and crash frames. */
export interface RuntimeHost {
  /** Whether the event bus parses mouse input. */
  readonly useMouse: boolean;
  enter(): void;
  resize(columns: number, rows: number): void;
  present(current: Surface, target: Surface, output: Uint8Array): void;
  exit(): void;
}

/**
 * Choose the host for one run: the `SurfacePresenter` from the options, or
 * the terminal behind `ctx.io` when the options name none.
 */
export function createRuntimeHost<M>(
  ctx: BijouContext,
  options: RunOptions<M> | undefined,
): RuntimeHost {
  const mouseMode = resolveMouseMode(options);
  const useMouse = mouseMode !== undefined;
  if (options?.presenter != null) {
    return presenterHost(options.presenter, ctx, useMouse);
  }
  const restoreScreen = (options?.altScreen ?? true)
    || (options?.hideCursor ?? true);
  return {
    useMouse,
    enter() {
      if (restoreScreen) enterScreen(ctx.io);
      ctx.io.write(useMouse ? mouseModeSequence(mouseMode) : DISABLE_MOUSE);
    },
    resize() {
      clearAndHome(ctx.io);
    },
    present(current, target, output) {
      renderSurfaceFrame(ctx.io, current, target, ctx.style, output);
    },
    exit() {
      if (useMouse) ctx.io.write(DISABLE_MOUSE);
      if (restoreScreen) exitScreen(ctx.io);
    },
  };
}

/** Route every signal to the presenter, so that `ctx.io` receives no bytes. */
function presenterHost(
  presenter: SurfacePresenter,
  ctx: BijouContext,
  useMouse: boolean,
): RuntimeHost {
  return {
    useMouse,
    enter() {
      presenter.enter?.();
    },
    resize(columns, rows) {
      presenter.onResize?.(columns, rows);
    },
    present(current, target) {
      presenter.present(current, target, ctx);
    },
    exit() {
      presenter.exit?.();
    },
  };
}
