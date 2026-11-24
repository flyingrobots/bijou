import { REPLAY_EVENT_SCHEMA } from './replay-event.js';

/**
 * Why a replay append, open or close failed.
 *
 * - `non-plain-value`: a value is not plain JSON data (DL-033 rejection list).
 * - `invalid-envelope`: `tick`, `atMs`, `kind` or `payload` is malformed, or
 *   the input carries another top-level field.
 * - `closed`: `append()` after `close()`.
 * - `failed`: `append()` after an earlier sink failure. The outbox is sticky.
 * - `sink-failed`: the sink threw while writing or closing; `cause` holds it.
 * - `open-failed`: a file-backed outbox could not open its path.
 */
export type ReplayOutboxErrorCode =
  | 'non-plain-value'
  | 'invalid-envelope'
  | 'closed'
  | 'failed'
  | 'sink-failed'
  | 'open-failed';

/** A typed replay outbox failure. The message never quotes recorded values. */
export class ReplayOutboxError extends Error {
  override readonly name = 'ReplayOutboxError';

  constructor(
    readonly code: ReplayOutboxErrorCode,
    readonly path: string,
    readonly detail: string,
    options?: { readonly cause?: unknown },
  ) {
    super(`${REPLAY_EVENT_SCHEMA} ${code} at ${path}: ${detail}`, options);
  }
}
