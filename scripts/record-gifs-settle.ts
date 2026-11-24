import type { EventEmitter } from 'node:events';
import type { RecordResult } from './record-gifs-report.js';

type Status = RecordResult['status'];

/**
 * Wire a spawned recorder's terminal events to one completion callback.
 *
 * Settlement rule: the first terminal event wins and `finish` runs exactly
 * once. A later success never overwrites an earlier failure, and a later
 * failure never turns a recorded success into a second report. Node may emit
 * `error` and then `close` for one child; both are terminal for the job.
 * After settling, the `close` listener is removed and the `error` listener is
 * swapped for a no-op, because an EventEmitter with no `error` listener throws
 * on a late `error` and would crash the whole run.
 */
export function watchRecorderProcess(
  proc: EventEmitter,
  finish: (status: Status) => void,
): void {
  let settled = false;

  const settle = (status: Status): void => {
    if (settled) return;
    settled = true;
    proc.off('close', onClose);
    proc.off('error', onError);
    proc.on('error', ignoreLateError);
    finish(status);
  };
  const onClose = (code: number | null): void => {
    settle(code === 0 ? 'success' : 'error');
  };
  const onError = (): void => {
    settle('error');
  };
  const ignoreLateError = (): void => {
    // The job already settled; its first outcome stands.
  };

  proc.on('close', onClose);
  proc.on('error', onError);
}
