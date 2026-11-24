import type { EventEmitter } from 'node:events';
import type { RecordResult } from './record-gifs-report.js';

type Status = RecordResult['status'];

/** Wire a spawned recorder's terminal events to one completion callback. */
export function watchRecorderProcess(
  proc: EventEmitter,
  finish: (status: Status) => void,
): void {
  proc.on('close', (code: number | null) => {
    finish(code === 0 ? 'success' : 'error');
  });
  proc.on('error', () => {
    finish('error');
  });
}
