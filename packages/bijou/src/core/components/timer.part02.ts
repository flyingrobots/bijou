import { resolveClock } from '../clock.js';
import { cursorGuard } from './cursor-guard.js';
import { CLEAR_LINE_RETURN } from '../ansi.js';
import {
  type LiveControllerConfig,
  type TimerController,
  type TimerState,
  timer,
} from './timer.part01.js';

export function computeElapsed(s: TimerState, nowMs: number): number {
  switch (s.kind) {
    case 'idle':
      return 0;
    case 'running':
      return s.pausedElapsed + (nowMs - s.startTime);
    case 'paused':
      return s.pausedElapsed;
    case 'stopped':
      return s.elapsedMs;
  }
}
/** Shared controller logic for createTimer and createStopwatch. */
export function createLiveController(
  config: LiveControllerConfig,
): TimerController {
  const {
    ctx,
    interval,
    timerOpts,
    displayMs,
    initialDisplayMs,
    onTick,
    onComplete,
  } = config;
  const clock = resolveClock(ctx);
  const mode = ctx.mode;

  let state: TimerState = { kind: 'idle' };

  function tick(): void {
    if (state.kind !== 'running') return;
    const elapsed = state.pausedElapsed + (clock.now() - state.startTime);
    if (onTick?.(elapsed)) {
      state.handle.dispose();
      if (mode === 'interactive') {
        ctx.io.write('\n');
        if (state.cursor !== null) {
          state.cursor.dispose();
        }
      }
      state = { kind: 'stopped', elapsedMs: elapsed };
      onComplete?.();
      return;
    }
    const line = timer(displayMs(elapsed), { ...timerOpts, ctx });
    ctx.io.write(`${CLEAR_LINE_RETURN}${line}`);
  }

  return {
    start() {
      if (state.kind === 'running' || state.kind === 'paused') {
        state.handle.dispose();
        if (state.cursor !== null) {
          state.cursor.dispose();
        }
      }

      if (mode !== 'interactive') {
        ctx.io.write(timer(initialDisplayMs, { ...timerOpts, ctx }) + '\n');
        if (onTick?.(0)) {
          onComplete?.();
        }
        state = { kind: 'idle' };
        return;
      }

      const cursor = cursorGuard(ctx.io).hide();

      if (onTick?.(0)) {
        cursor.dispose();
        state = { kind: 'stopped', elapsedMs: 0 };
        onComplete?.();
        return;
      }

      const now = clock.now();
      const line = timer(displayMs(0), { ...timerOpts, ctx });
      ctx.io.write(`${CLEAR_LINE_RETURN}${line}`);
      const handle = clock.setInterval(tick, interval);
      state = {
        kind: 'running',
        startTime: now,
        pausedElapsed: 0,
        handle,
        cursor,
      };
    },

    pause() {
      if (state.kind !== 'running') return;
      const elapsed = state.pausedElapsed + (clock.now() - state.startTime);
      state = {
        kind: 'paused',
        pausedElapsed: elapsed,
        handle: state.handle,
        cursor: state.cursor,
      };
    },

    resume() {
      if (state.kind !== 'paused') return;
      state = {
        kind: 'running',
        startTime: clock.now(),
        pausedElapsed: state.pausedElapsed,
        handle: state.handle,
        cursor: state.cursor,
      };
    },

    stop(finalMessage?: string) {
      const elapsed = computeElapsed(state, clock.now());
      if (state.kind === 'running' || state.kind === 'paused') {
        state.handle.dispose();
        if (mode === 'interactive') {
          ctx.io.write(CLEAR_LINE_RETURN);
          if (state.cursor !== null) {
            state.cursor.dispose();
          }
        }
      }
      state = { kind: 'stopped', elapsedMs: elapsed };
      if (finalMessage !== undefined) {
        ctx.io.write(finalMessage + '\n');
      }
    },

    elapsed() {
      return computeElapsed(state, clock.now());
    },
  };
}
