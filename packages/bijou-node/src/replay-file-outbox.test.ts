import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ajv } from 'ajv';
import { afterEach, describe, expect, it } from 'vitest';
import {
  canonicalJson,
  createMemoryReplayOutbox,
  surfaceFrameHash,
  type ReplayEventInput,
  type ReplayOutbox,
} from '@flyingrobots/bijou';
import { createReplayFileOutbox } from './replay-file-outbox.js';
import {
  EMPTY_SESSION_EVENTS,
  GOLDEN_FRAME_HASH,
  GOLDEN_REPLAY_EVENTS,
  GOLDEN_REPLAY_JSONL,
} from './replay-golden.test-support.js';

const dirs: string[] = [];
const SCHEMA_URL = new URL('../../../schemas/bijou-replay-event.v1.schema.json', import.meta.url);
const schema: unknown = JSON.parse(readFileSync(SCHEMA_URL, 'utf8'));
const validate = new Ajv({ strict: true, allowUnionTypes: true }).compile(typeof schema === 'object' && schema !== null ? schema : {});

/** Validate every line against the published schema; return the failures. */
function validateReplayLines(jsonl: string): string[] {
  return jsonl.split('\n').slice(0, -1).flatMap((line, index) => {
    const parsed: unknown = JSON.parse(line);
    return validate(parsed) ? [] : [`line ${String(index)}: ${JSON.stringify(validate.errors)}`];
  });
}

function tempPath(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'bijou-replay-'));
  dirs.push(dir);
  return join(dir, name);
}

function record(outbox: ReplayOutbox, events: readonly ReplayEventInput[]): void {
  for (const event of events) outbox.append(event);
  outbox.close();
}

function recordToFile(events: readonly ReplayEventInput[]): string {
  const path = tempPath('run.jsonl');
  record(createReplayFileOutbox(path), events);
  return readFileSync(path, 'utf8');
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('ReplayOutbox golden output', () => {
  it('writes the golden JSONL bytes from memory', () => {
    const outbox = createMemoryReplayOutbox();
    record(outbox, GOLDEN_REPLAY_EVENTS);
    expect(outbox.toJSONL()).toBe(GOLDEN_REPLAY_JSONL);
  });

  it('writes the same golden bytes to a file', () => {
    const path = tempPath('golden.jsonl');
    record(createReplayFileOutbox(path), GOLDEN_REPLAY_EVENTS);
    expect(readFileSync(path).equals(Buffer.from(GOLDEN_REPLAY_JSONL, 'utf8'))).toBe(true);
  });

  it('frames every line as UTF-8 JSON ending in a newline, with no byte-order mark', () => {
    const bytes = Buffer.from(recordToFile(GOLDEN_REPLAY_EVENTS), 'utf8');
    expect(bytes[0]).toBe(0x7b);
    expect(bytes.at(-1)).toBe(0x0a);
    expect(bytes.toString('utf8').split('\n')).toHaveLength(GOLDEN_REPLAY_EVENTS.length + 1);
  });

  it('validates every written line against the published JSON Schema', () => {
    expect(validateReplayLines(recordToFile(GOLDEN_REPLAY_EVENTS))).toEqual([]);
    expect(validateReplayLines(recordToFile(EMPTY_SESSION_EVENTS))).toEqual([]);
  });

  it('has a schema that rejects lines breaking the DL-033 envelope', () => {
    const line = (event: object): string => `${JSON.stringify({ schema: 'bijou-replay-event/1', seq: 0, tick: 0, atMs: 0, ...event })}\n`;
    expect(validateReplayLines(line({ kind: 'pulse', payload: { origin: 'script', cmd: 0, dt: 1 } }))).toHaveLength(1);
    expect(validateReplayLines(line({ kind: 'resize', payload: { origin: 'command', columns: 1, rows: 1 } }))).toHaveLength(1);
    expect(validateReplayLines(line({ kind: 'end', payload: { frames: 0, pendingCommands: 0 } }))).toHaveLength(1);
    expect(validateReplayLines(line({ kind: 'end', payload: {}, eventId: 'x' }))).toHaveLength(1);
  });

  it('round-trips: parsed lines equal events() and re-serialize to the same bytes', () => {
    const outbox = createMemoryReplayOutbox();
    record(outbox, GOLDEN_REPLAY_EVENTS);
    const lines = recordToFile(GOLDEN_REPLAY_EVENTS).split('\n').slice(0, -1);
    const parsed = lines.map((line): unknown => JSON.parse(line));
    expect(parsed).toEqual(outbox.events());
    expect(parsed.map((event) => `${canonicalJson(event)}\n`).join('')).toBe(GOLDEN_REPLAY_JSONL);
  });

  it('records an empty session (session and end) identically in both modes', () => {
    const outbox = createMemoryReplayOutbox();
    record(outbox, EMPTY_SESSION_EVENTS);
    expect(recordToFile(EMPTY_SESSION_EVENTS)).toBe(outbox.toJSONL());
    expect(outbox.events().map((event) => [event.seq, event.kind])).toEqual([[0, 'session'], [1, 'end']]);
  });
});

describe('surfaceFrameHash()', () => {
  it('hashes the canonical frame content, matching node:crypto and the golden', () => {
    const frame = GOLDEN_REPLAY_EVENTS.find((event) => event.kind === 'frame');
    if (frame?.kind !== 'frame') throw new Error('golden frame is missing');
    const { width, height, styles, cells } = frame.payload;
    const expected = createHash('sha256')
      .update(canonicalJson({ width, height, styles, cells }), 'utf8')
      .digest('hex');
    expect(surfaceFrameHash(frame.payload)).toBe(`sha256:${expected}`);
    expect(surfaceFrameHash(frame.payload)).toBe(GOLDEN_FRAME_HASH);
  });
});
