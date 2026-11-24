import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ReplayOutboxError, type ReplayEventInput } from '@flyingrobots/bijou';
import { createReplayFileOutbox } from './replay-file-outbox.js';
import { GOLDEN_REPLAY_EVENTS, GOLDEN_REPLAY_JSONL } from './replay-golden.test-support.js';

const dirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bijou-replay-'));
  dirs.push(dir);
  return dir;
}

function failure(run: () => unknown): ReplayOutboxError {
  try {
    run();
  } catch (error) {
    if (error instanceof ReplayOutboxError) return error;
    throw error;
  }
  throw new Error('expected a ReplayOutboxError');
}

function causeCode(error: ReplayOutboxError): unknown {
  const cause: unknown = error.cause;
  return cause instanceof Error && 'code' in cause ? cause.code : undefined;
}

const fact: ReplayEventInput = { tick: 0, atMs: 0, kind: 'debug-fact', payload: { name: 'x', value: 1 } };

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('createReplayFileOutbox() lifecycle and errors', () => {
  it('refuses to reopen a recorded path and leaves its bytes intact', () => {
    const path = join(tempDir(), 'run.jsonl');
    const first = createReplayFileOutbox(path);
    for (const event of GOLDEN_REPLAY_EVENTS) first.append(event);
    first.close();
    const reopened = failure(() => createReplayFileOutbox(path));
    expect(reopened.code).toBe('open-failed');
    expect(causeCode(reopened)).toBe('EEXIST');
    expect(readFileSync(path, 'utf8')).toBe(GOLDEN_REPLAY_JSONL);
  });

  it('replaces the file when reopened with overwrite, restarting seq at 0', () => {
    const path = join(tempDir(), 'run.jsonl');
    writeFileSync(path, 'stale\n');
    const outbox = createReplayFileOutbox(path, { overwrite: true });
    expect(outbox.append(fact)).toBe(0);
    outbox.close();
    expect(readFileSync(path, 'utf8')).toBe(
      '{"atMs":0,"kind":"debug-fact","payload":{"name":"x","value":1},"schema":"bijou-replay-event/1","seq":0,"tick":0}\n',
    );
  });

  it('throws closed for an append after close and writes nothing more', () => {
    const path = join(tempDir(), 'run.jsonl');
    const outbox = createReplayFileOutbox(path);
    outbox.append(fact);
    outbox.close();
    const before = readFileSync(path, 'utf8');
    expect(failure(() => outbox.append(fact)).code).toBe('closed');
    expect(readFileSync(path, 'utf8')).toBe(before);
    expect(outbox.path).toBe(path);
  });

  it('throws open-failed for a path in a missing directory and creates nothing', () => {
    const path = join(tempDir(), 'missing', 'run.jsonl');
    const error = failure(() => createReplayFileOutbox(path));
    expect(error.code).toBe('open-failed');
    expect(causeCode(error)).toBe('ENOENT');
    expect(existsSync(path)).toBe(false);
  });

  it('throws open-failed when the path is a directory', () => {
    expect(failure(() => createReplayFileOutbox(tempDir(), { overwrite: true })).code).toBe('open-failed');
  });

  it('writes nothing for a rejected payload and keeps seq contiguous', () => {
    const path = join(tempDir(), 'run.jsonl');
    const outbox = createReplayFileOutbox(path);
    outbox.append(fact);
    const callback: ReplayEventInput = {
      tick: 0, atMs: 1, kind: 'input', payload: { origin: 'script', msg: { run: () => 1 } },
    };
    expect(failure(() => outbox.append(callback)).code).toBe('non-plain-value');
    expect(outbox.append(fact)).toBe(1);
    outbox.close();
    expect(readFileSync(path, 'utf8').split('\n').map((line) => line.slice(-16))).toEqual([
      '"seq":0,"tick":0}', '"seq":1,"tick":0}', '',
    ].map((tail) => tail.slice(-16)));
  });

  // Linux exposes a device that always reports a full disk.
  it.runIf(existsSync('/dev/full'))('reports a full disk as sink-failed, then stays failed', () => {
    const outbox = createReplayFileOutbox('/dev/full', { overwrite: true });
    const error = failure(() => outbox.append(fact));
    expect(error.code).toBe('sink-failed');
    expect(causeCode(error)).toBe('ENOSPC');
    expect(outbox.state).toBe('failed');
    expect(failure(() => outbox.append(fact)).code).toBe('failed');
    expect(outbox.nextSeq).toBe(0);
    outbox.close();
  });
});
