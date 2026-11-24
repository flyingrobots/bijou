import { REPLAY_EVENT_KINDS, REPLAY_EVENT_SCHEMA, type ReplayEvent } from './replay-event.js';
import { createReplayOutbox, type ReplayOutbox } from './replay-outbox.js';

/** An outbox that keeps its canonical lines in memory. Usable in a browser. */
export interface MemoryReplayOutbox extends ReplayOutbox {
  /** Fresh copies of the recorded events, parsed back from their lines. */
  events(): ReplayEvent[];
  /** The recorded JSONL: the same bytes a file-backed outbox writes. */
  toJSONL(): string;
}

/** Build an in-memory outbox. Recorded lines stay readable after `close()`. */
export function createMemoryReplayOutbox(): MemoryReplayOutbox {
  const lines: string[] = [];
  const outbox = createReplayOutbox({
    writeLine(line: string): void {
      lines.push(line);
    },
    close(): void {
      // Nothing to release: the lines stay readable.
    },
  });
  return {
    append: (event) => outbox.append(event),
    close: () => {
      outbox.close();
    },
    get state() {
      return outbox.state;
    },
    get nextSeq() {
      return outbox.nextSeq;
    },
    events: () => lines.map(parseRecordedLine),
    toJSONL: () => lines.join(''),
  };
}

function parseRecordedLine(line: string): ReplayEvent {
  const parsed: unknown = JSON.parse(line);
  if (!isReplayEvent(parsed)) throw new Error("a recorded line is not a replay event");
  return parsed;
}

function isReplayEvent(value: unknown): value is ReplayEvent {
  if (value === null || typeof value !== 'object') return false;
  const fields = new Map(Object.entries(value));
  const payload: unknown = fields.get('payload');
  return fields.get('schema') === REPLAY_EVENT_SCHEMA
    && typeof fields.get('seq') === 'number'
    && typeof fields.get('tick') === 'number'
    && typeof fields.get('atMs') === 'number'
    && REPLAY_EVENT_KINDS.some((kind) => kind === fields.get('kind'))
    && payload !== null && typeof payload === 'object';
}
