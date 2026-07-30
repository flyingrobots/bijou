import type {
  BijouContext,
  ClockPort,
  TimerHandle,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import { DISABLE_MOUSE } from './mouse-mode.js';
import { exitScreen } from './screen.js';
import type {
  RuntimeRenderer,
  RuntimeSession,
} from './runtime-contract.js';
import {
  formatRuntimeDetail,
  writeErrorLine,
} from './runtime-format.js';

const DRAIN_TIMEOUT_MS = 1000;

/** Flush scheduled work, drain commands with a deadline, and restore the TTY. */
export async function finalizeRuntime<Model, M>(
  session: RuntimeSession<Model>,
  renderer: RuntimeRenderer,
  bus: EventBus<M>,
  clock: ClockPort,
  ctx: BijouContext,
  useMouse: boolean,
  restoreScreen: boolean,
): Promise<void> {
  if (renderer.hasPendingRender()) {
    await new Promise<void>((resolve) => {
      let handle: TimerHandle | null = null;
      handle = clock.setTimeout(() => {
        handle?.dispose();
        handle = null;
        resolve();
      }, 0);
    });
  }
  if (await drainWithin(bus, clock, DRAIN_TIMEOUT_MS) === 'timed-out') {
    const message =
      `Timed out waiting ${String(DRAIN_TIMEOUT_MS)}ms for pending commands`
      + ' to drain during shutdown.';
    writeErrorLine(ctx.io, `[Runtime Warning] ${message}\n`);
  }
  renderer.dispose();
  bus.stopPulse();
  bus.dispose();
  if (useMouse) ctx.io.write(DISABLE_MOUSE);
  if (restoreScreen) exitScreen(ctx.io);
  if (session.fatalError != null) {
    throw session.fatalError instanceof Error
      ? session.fatalError
      : new Error(formatRuntimeDetail(session.fatalError));
  }
}

export async function drainWithin(
  bus: { drain(): Promise<void> },
  clock: ClockPort,
  timeout: number,
): Promise<'drained' | 'timed-out'> {
  let handle: TimerHandle | null = null;
  try {
    return await new Promise((resolve) => {
      let settled = false;
      const finish = (result: 'drained' | 'timed-out'): void => {
        if (settled) return;
        settled = true;
        handle?.dispose();
        handle = null;
        resolve(result);
      };
      handle = clock.setTimeout(() => {
        finish('timed-out');
      }, timeout);
      void bus.drain().then(
        () => {
          finish('drained');
        },
        () => {
          finish('drained');
        },
      );
    });
  } finally {
    disposeHandle(handle);
  }
}

function disposeHandle(handle: TimerHandle | null): void {
  handle?.dispose();
}
