import type {
  BijouContext,
  ClockPort,
} from '@flyingrobots/bijou';
import {
  createEventBus,
  type EventBus,
} from './eventbus.js';
import type {
  RunOptions,
  RuntimeIssue,
} from './types.js';
import {
  formatRuntimeDetail,
  writeErrorLine,
} from './runtime-format.js';

/** Create the runtime bus with issue routing and error-reporting policy. */
export function createRuntimeBus<M>(
  options: RunOptions<M> | undefined,
  clock: ClockPort,
  ctx: BijouContext,
  routeIssue: (issue: RuntimeIssue) => void,
): EventBus<M> {
  return createEventBus({
    clock,
    commandBackpressureThreshold: options?.commandBackpressureThreshold,
    onCommandBackpressure(info) {
      const message =
        `Command backpressure: ${String(info.pendingCommands)} commands`
        + ` pending (threshold ${String(info.backpressureThreshold)})`;
      writeErrorLine(ctx.io, `[EventBus] ${message}\n`);
      routeIssue({
        level: 'warning',
        source: 'command',
        message,
        atMs: info.atMs,
      });
    },
    onCommandRejected(error) {
      const message = error instanceof Error
        ? `${error.name}: ${error.message}`
        : formatRuntimeDetail(error);
      writeErrorLine(ctx.io, `[EventBus] Command rejected: ${message}\n`);
      routeIssue({
        level: 'error',
        source: 'command',
        message,
        atMs: clock.now(),
        error,
      });
    },
    onError(message, error) {
      const detail = error instanceof Error
        ? `${error.name}: ${error.message}`
        : formatRuntimeDetail(error);
      writeErrorLine(ctx.io, `${message} ${detail}\n`);
      routeIssue({
        level: 'warning',
        source: 'eventbus',
        message: `${message} ${detail}`,
        atMs: clock.now(),
        error,
      });
    },
  });
}
