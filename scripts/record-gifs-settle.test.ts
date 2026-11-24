import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { watchRecorderProcess } from './record-gifs-settle.js';

type Status = 'success' | 'error';

function watched(): { proc: EventEmitter; seen: Status[] } {
  const proc = new EventEmitter();
  const seen: Status[] = [];
  watchRecorderProcess(proc, (status) => {
    seen.push(status);
  });
  return { proc, seen };
}

describe('record-gifs completion settles exactly once', () => {
  it('reports one completion when error is followed by close', () => {
    const { proc, seen } = watched();
    proc.emit('error', new Error('spawn vhs ENOENT'));
    proc.emit('close', -2);
    expect(seen).toEqual(['error']);
  });

  it('reports one completion when close is emitted twice', () => {
    const { proc, seen } = watched();
    proc.emit('close', 0);
    proc.emit('close', 0);
    expect(seen).toEqual(['success']);
  });

  it('keeps an earlier success when an error follows', () => {
    const { proc, seen } = watched();
    proc.emit('close', 0);
    proc.emit('error', new Error('late'));
    expect(seen).toEqual(['success']);
  });

  it('keeps an earlier failure when a success follows', () => {
    const { proc, seen } = watched();
    proc.emit('error', new Error('boom'));
    proc.emit('close', 0);
    expect(seen).toEqual(['error']);
  });

  it('still reports a spawn failure explicitly', () => {
    const { proc, seen } = watched();
    proc.emit('error', new Error('spawn vhs ENOENT'));
    expect(seen).toEqual(['error']);
  });

  it('releases its listeners once it has settled', () => {
    const { proc } = watched();
    proc.emit('close', 0);
    expect(proc.listenerCount('close')).toBe(0);
    expect(() => proc.emit('error', new Error('late'))).not.toThrow();
  });
});
