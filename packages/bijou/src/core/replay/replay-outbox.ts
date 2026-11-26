import { canonicalJson } from './canonical-json.js';
import { REPLAY_EVENT_KINDS, REPLAY_EVENT_SCHEMA, type ReplayEventInput, type ReplayEventKind } from './replay-event.js';
import { ReplayOutboxError } from './replay-outbox-error.js';

/**
 * Where the outbox writes. Each call receives one whole line: canonical JSON
 * followed by `\n`. A sink signals failure by throwing.
 */
export interface ReplayLineSinkPort {
  writeLine(line: string): void;
  close(): void;
}

export type ReplayOutboxState = 'open' | 'closed' | 'failed';

/** Accepts `bijou-replay-event/1` events and assigns `seq` in append order. */
export interface ReplayOutbox {
  /**
   * Validate, number and write one event; return its `seq`. Throws a typed
   * {@link ReplayOutboxError}. A rejected append consumes no `seq`.
   */
  append(event: ReplayEventInput): number;
  /** Close the sink. Idempotent; later appends throw `closed`. */
  close(): void;
  readonly state: ReplayOutboxState;
  /** The `seq` the next accepted event receives. */
  readonly nextSeq: number;
}

const INPUT_KEYS = ['atMs', 'kind', 'payload', 'tick'];

/** Build an outbox over any sink. It reads no clock and no randomness. */
export function createReplayOutbox(sink: ReplayLineSinkPort): ReplayOutbox {
  let state: ReplayOutboxState = 'open';
  let nextSeq = 0;
  return {
    append(event: ReplayEventInput): number {
      if (state !== 'open') {
        throw new ReplayOutboxError(state, '$', `the outbox is ${state}; nothing was recorded`);
      }
      const line = `${serializeEvent(event, nextSeq)}\n`;
      try {
        sink.writeLine(line);
      } catch (cause) {
        state = 'failed';
        throw new ReplayOutboxError('sink-failed', '$', `writing seq ${String(nextSeq)} failed`, { cause });
      }
      nextSeq += 1;
      return nextSeq - 1;
    },
    close(): void {
      if (state === 'closed') return;
      state = 'closed';
      try {
        sink.close();
      } catch (cause) {
        throw new ReplayOutboxError('sink-failed', '$', 'closing the sink failed', { cause });
      }
    },
    get state() {
      return state;
    },
    get nextSeq() {
      return nextSeq;
    },
  };
}

/** Validate an untrusted event and return its canonical line without `\n`. */
function serializeEvent(event: unknown, seq: number): string {
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw invalid('$', 'an event must be a plain object');
  }
  const keys = Object.keys(event).sort();
  if (keys.join(',') !== INPUT_KEYS.join(',')) {
    throw invalid('$', `expected exactly the fields ${INPUT_KEYS.join(', ')}`);
  }
  const fields = new Map(Object.entries(event));
  const tick: unknown = fields.get('tick');
  const atMs: unknown = fields.get('atMs');
  const kind: unknown = fields.get('kind');
  const payload: unknown = fields.get('payload');
  assertCount('$.tick', tick);
  assertCount('$.atMs', atMs);
  if (!isKind(kind)) throw invalid('$.kind', `expected one of ${REPLAY_EVENT_KINDS.join(', ')}`);
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw invalid('$.payload', 'a payload must be a plain object');
  }
  return canonicalJson({ atMs, kind, payload, schema: REPLAY_EVENT_SCHEMA, seq, tick });
}

function assertCount(path: string, value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw invalid(path, 'expected a non-negative safe integer');
  }
}

function isKind(value: unknown): value is ReplayEventKind {
  return REPLAY_EVENT_KINDS.some((kind) => kind === value);
}

function invalid(path: string, detail: string): ReplayOutboxError {
  return new ReplayOutboxError('invalid-envelope', path, detail);
}
