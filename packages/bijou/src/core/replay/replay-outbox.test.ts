import { describe, expect, it } from 'vitest';
import { createMemoryReplayOutbox } from './memory-replay-outbox.js';
import { createReplayOutbox, type ReplayLineSinkPort } from './replay-outbox.js';
import type { ReplayEventInput } from './replay-event.js';
import { ReplayOutboxError, type ReplayOutboxErrorCode } from './replay-outbox-error.js';

const fact = (n: number, value: unknown = n): ReplayEventInput => ({
  tick: 0, atMs: n, kind: 'debug-fact', payload: { name: 'n', value },
});

function codeOf(run: () => unknown): ReplayOutboxErrorCode {
  try {
    run();
  } catch (error) {
    if (error instanceof ReplayOutboxError) return error.code;
    throw error;
  }
  throw new Error('expected a ReplayOutboxError');
}

/** A sink that fails on the given write, keeping what it accepted. */
function failingSink(failOnWrite: number): ReplayLineSinkPort & { lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    writeLine(line: string): void {
      if (lines.length === failOnWrite) throw new Error('disk full');
      lines.push(line);
    },
    close(): void {
      lines.push('<closed>');
    },
  };
}

describe('createMemoryReplayOutbox()', () => {
  it('assigns seq from 0 in append order and adds the schema', () => {
    const outbox = createMemoryReplayOutbox();
    expect([outbox.append(fact(5)), outbox.append(fact(1))]).toEqual([0, 1]);
    expect(outbox.toJSONL()).toBe(
      '{"atMs":5,"kind":"debug-fact","payload":{"name":"n","value":5},"schema":"bijou-replay-event/1","seq":0,"tick":0}\n'
      + '{"atMs":1,"kind":"debug-fact","payload":{"name":"n","value":1},"schema":"bijou-replay-event/1","seq":1,"tick":0}\n',
    );
    expect(outbox.events().map((event) => [event.seq, event.atMs])).toEqual([[0, 5], [1, 1]]);
  });

  it('keeps every event in order under rapid appends', () => {
    const outbox = createMemoryReplayOutbox();
    for (let n = 0; n < 5000; n++) outbox.append(fact(n));
    const lines = outbox.toJSONL().split('\n');
    expect(lines.pop()).toBe('');
    expect(lines).toHaveLength(5000);
    lines.forEach((line, n) => {
      expect(line.endsWith(`"seq":${String(n)},"tick":0}`)).toBe(true);
    });
  });

  it('rejects a callback in a payload and leaves no seq gap', () => {
    const outbox = createMemoryReplayOutbox();
    outbox.append(fact(0));
    expect(codeOf(() => outbox.append(fact(1, { onDone: () => undefined })))).toBe('non-plain-value');
    expect(outbox.append(fact(2))).toBe(1);
    expect(outbox.events().map((event) => event.seq)).toEqual([0, 1]);
  });

  it('snapshots payloads at append time', () => {
    const outbox = createMemoryReplayOutbox();
    const value = { count: 1 };
    outbox.append(fact(0, value));
    value.count = 2;
    expect(outbox.events()[0]?.payload).toEqual({ name: 'n', value: { count: 1 } });
  });

  it.each([
    ['a negative tick', { tick: -1, atMs: 0, kind: 'end', payload: {} }],
    ['a fractional atMs', { tick: 0, atMs: 1.5, kind: 'end', payload: {} }],
    ['an unknown kind', { tick: 0, atMs: 0, kind: 'update', payload: {} }],
    ['an array payload', { tick: 0, atMs: 0, kind: 'end', payload: [] }],
    ['an extra top-level field', { tick: 0, atMs: 0, kind: 'end', payload: {}, seq: 7 }],
    ['a missing payload', { tick: 0, atMs: 0, kind: 'end' }],
    ['a non-object event', 'end'],
  ])('rejects %s as an invalid envelope', (_label, event) => {
    const outbox = createReplayOutbox(failingSink(99));
    // A JavaScript caller's view: append() validates untrusted input at runtime.
    const untyped: { append(input: unknown): number } = outbox;
    expect(codeOf(() => untyped.append(event))).toBe('invalid-envelope');
    expect(outbox.nextSeq).toBe(0);
  });

  it('enforces no kind order: ordering belongs to the emitter (DL-033)', () => {
    const outbox = createMemoryReplayOutbox();
    outbox.append({ tick: 0, atMs: 0, kind: 'end', payload: { frames: 0, pendingCommands: 0, reason: 'quit' } });
    outbox.close();
    expect(outbox.events().map((event) => event.kind)).toEqual(['end']);
  });

  it('refuses appends after close and keeps the recorded lines', () => {
    const outbox = createMemoryReplayOutbox();
    outbox.append(fact(0));
    outbox.close();
    outbox.close();
    expect(outbox.state).toBe('closed');
    expect(codeOf(() => outbox.append(fact(1)))).toBe('closed');
    expect(outbox.events()).toHaveLength(1);
  });
});

describe('createReplayOutbox() over a failing sink', () => {
  it('reports sink-failed with the cause, then stays failed', () => {
    const sink = failingSink(1);
    const outbox = createReplayOutbox(sink);
    outbox.append(fact(0));
    let failure: unknown;
    try {
      outbox.append(fact(1));
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ReplayOutboxError);
    expect(failure instanceof ReplayOutboxError ? failure.cause : undefined).toEqual(new Error('disk full'));
    expect(outbox.state).toBe('failed');
    expect(codeOf(() => outbox.append(fact(2)))).toBe('failed');
    expect(outbox.nextSeq).toBe(1);
    outbox.close();
    expect(sink.lines).toHaveLength(2);
    expect(sink.lines[1]).toBe('<closed>');
  });

  it('reports a failing close as sink-failed', () => {
    const outbox = createReplayOutbox({
      writeLine: () => undefined,
      close: () => {
        throw new Error('EIO');
      },
    });
    expect(codeOf(() => {
      outbox.close();
    })).toBe('sink-failed');
    expect(outbox.state).toBe('closed');
  });
});
