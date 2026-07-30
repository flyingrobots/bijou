import {
  stringToSurface,
  type BijouContext,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import { renderSurfaceFrame } from './screen.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import type { RuntimeSession } from './runtime-contract.js';
import {
  formatModelSnapshot,
  formatRuntimeDetail,
  writeErrorLine,
} from './runtime-format.js';

/** Enter the terminal-visible crash state exactly once. */
export function enterRuntimeCrashMode<Model, M>(
  phase: 'update' | 'render' | 'resize',
  error: unknown,
  snapshot: Model,
  session: RuntimeSession<Model>,
  buffers: RuntimeFramebuffers,
  ctx: BijouContext,
  bus: EventBus<M>,
  viewport: () => { columns: number; rows: number },
  shutdown: (error?: unknown) => void,
): void {
  if (session.fatalError === null) session.fatalError = error;
  writeErrorLine(
    ctx.io,
    `[Runtime Error] ${formatRuntimeDetail(error)}\n`,
  );
  if (session.crashMode) return;
  session.crashMode = true;
  session.renderQueued = false;
  session.renderHandle?.dispose();
  session.renderHandle = null;
  bus.stopPulse();
  try {
    const size = viewport();
    buffers.ensure(size.columns, size.rows);
    const detail = formatRuntimeDetail(error);
    const surface = stringToSurface([
      'Bijou runtime crash',
      '',
      `Phase: ${phase}`,
      '',
      'Error',
      detail,
      '',
      'Model snapshot',
      formatModelSnapshot(snapshot),
      '',
      ctx.runtime.stdinIsTTY
        ? 'Press Enter to exit.'
        : 'Stdin is not interactive; exiting automatically.',
    ].join('\n'), size.columns, size.rows);
    renderSurfaceFrame(
      ctx.io,
      buffers.current,
      surface,
      ctx.style,
      buffers.output,
    );
    buffers.replaceFront(surface);
    if (!ctx.runtime.stdinIsTTY) shutdown(session.fatalError);
  } catch (renderError) {
    writeErrorLine(
      ctx.io,
      '[Runtime Error] Failed to render crash surface: '
        + `${formatRuntimeDetail(renderError)}\n`,
    );
    shutdown(session.fatalError);
  }
}
