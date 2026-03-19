import { describe, it, expect } from 'vitest';
import { mockIO } from './io.js';
import { mockClock } from './clock.js';

describe('mockIO()', () => {
  it('write() captures output to written buffer', () => {
    const io = mockIO();
    io.write('hello');
    io.write('world');
    expect(io.written).toEqual(['hello', 'world']);
  });

  it('question() captures prompt and returns queued answers', async () => {
    const io = mockIO({ answers: ['alice', 'bob'] });
    const a1 = await io.question('Name? ');
    const a2 = await io.question('Friend? ');
    expect(a1).toBe('alice');
    expect(a2).toBe('bob');
    expect(io.written).toEqual(['Name? ', 'Friend? ']);
  });

  it('question() returns empty string when queue is exhausted', async () => {
    const io = mockIO({ answers: ['once'] });
    await io.question('1? ');
    const result = await io.question('2? ');
    expect(result).toBe('');
    expect(io.written).toEqual(['1? ', '2? ']);
  });

  it('readFile() returns content from mock filesystem', () => {
    const io = mockIO({ files: { '/tmp/a.txt': 'contents' } });
    expect(io.readFile('/tmp/a.txt')).toBe('contents');
  });

  it('readFile() throws for missing file', () => {
    const io = mockIO();
    expect(() => io.readFile('/nope')).toThrow('Mock: file not found');
  });

  it('readDir() returns entries from mock dirs', () => {
    const io = mockIO({ dirs: { '/logos': ['a.txt', 'b.txt'] } });
    expect(io.readDir('/logos')).toEqual(['a.txt', 'b.txt']);
  });

  it('readDir() returns empty array for unknown directory', () => {
    const io = mockIO();
    expect(io.readDir('/nope')).toEqual([]);
  });

  it('joinPath() joins path segments', () => {
    const io = mockIO();
    // Uses path.join internally; hardcoded POSIX expectation
    expect(io.joinPath('/foo', 'bar', 'baz.txt')).toBe('/foo/bar/baz.txt');
  });

  it('rawInput() returns a disposable handle', () => {
    const io = mockIO();
    const handle = io.rawInput(() => {});
    expect(handle.dispose).toBeTypeOf('function');
    handle.dispose(); // should not throw
  });

  it('setInterval() returns a disposable handle', () => {
    const clock = mockClock();
    const calls: number[] = [];
    const io = mockIO({ clock });
    const handle = io.setInterval(() => {
      calls.push(clock.now());
    }, 1000);

    clock.advanceBy(3_000);
    expect(calls).toEqual([1_000, 2_000, 3_000]);

    handle.dispose();
    clock.advanceBy(2_000);
    expect(calls).toEqual([1_000, 2_000, 3_000]);
  });
});
