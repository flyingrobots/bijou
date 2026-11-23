import { describe, expect, it } from 'vitest';
import { createWebClock, createWebOutputIO, createWebRuntime, WebUnsupportedCapabilityError } from './index.js';
import { createFakeClockHost } from './clock.test-support.js';

const encoder = new TextEncoder();

describe('createWebOutputIO() write routing', () => {
  it('keeps output and error text in separate inspectable buffers', () => {
    const io = createWebOutputIO();
    io.write('one\n');
    io.writeError('oops\n');
    io.write('two\n');
    expect(io.output()).toBe('one\ntwo\n');
    expect(io.errorOutput()).toBe('oops\n');
    io.clear();
    expect([io.output(), io.errorOutput()]).toEqual(['', '']);
  });

  it('routes text to caller-supplied sinks instead of the buffers', () => {
    const out: string[] = [];
    const err: string[] = [];
    const io = createWebOutputIO({ write: (data) => out.push(data), writeError: (data) => err.push(data) });
    io.write('one');
    io.writeError('oops');
    expect([out, err]).toEqual([['one'], ['oops']]);
    expect([io.output(), io.errorOutput()]).toEqual(['', '']);
  });

  it('retains only the most recent text once the buffer limit is reached', () => {
    const io = createWebOutputIO({ bufferLimit: 5 });
    io.write('abcdef');
    io.write('gh');
    expect(io.output()).toBe('defgh');
  });
});

describe('createWebOutputIO() writeBytes', () => {
  it('reads only len bytes when len is shorter than the buffer', () => {
    const io = createWebOutputIO();
    io.writeBytes(encoder.encode('hello world'), 5);
    expect(io.output()).toBe('hello');
  });

  it.each([
    ['longer than the buffer', 99, 'abc'],
    ['negative', -1, ''],
    ['not a number', Number.NaN, ''],
    ['fractional', 2.9, 'ab'],
  ])('clamps a len that is %s', (_label, len, want) => {
    const io = createWebOutputIO();
    io.writeBytes(encoder.encode('abc'), len);
    expect(io.output()).toBe(want);
  });

  it('decodes a multi-byte character split across two writes', () => {
    const chunks: string[] = [];
    const io = createWebOutputIO({ write: (data) => chunks.push(data) });
    const bytes = encoder.encode('é!');
    io.writeBytes(bytes.subarray(0, 1), 1);
    io.writeBytes(bytes.subarray(1), 2);
    expect(chunks.join('')).toBe('é!');
  });

  it('hands exactly len bytes to a caller-supplied byte sink', () => {
    const received: number[][] = [];
    const io = createWebOutputIO({ writeBytes: (bytes) => received.push([...bytes]) });
    io.writeBytes(Uint8Array.of(104, 105, 33, 33), 2);
    expect(received).toEqual([[104, 105]]);
    expect(io.output()).toBe('');
  });
});

describe('createWebOutputIO() unsupported capabilities', () => {
  const io = createWebOutputIO();

  it.each([
    ['FilePort.readFile', () => io.readFile('theme.json')],
    ['FilePort.readDir', () => io.readDir('assets/')],
    ['InteractivePort.rawInput', () => io.rawInput(() => undefined)],
  ] as const)('refuses %s with a typed error', (capability, call) => {
    let thrown: unknown;
    try { call(); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(WebUnsupportedCapabilityError);
    expect(thrown).not.toBeInstanceOf(ReferenceError);
    expect(thrown).toMatchObject({ name: 'WebUnsupportedCapabilityError', code: 'BIJOU_WEB_UNSUPPORTED_CAPABILITY', capability });
    expect(String(thrown)).toContain(`${capability} is not supported in a browser host`);
  });

  it('rejects QueryPort.question with a typed error', async () => {
    const pending = io.question('Name? ');
    await expect(pending).rejects.toBeInstanceOf(WebUnsupportedCapabilityError);
    await expect(pending).rejects.toMatchObject({ capability: 'QueryPort.question' });
    expect(io.output()).toBe('');
  });
});

describe('createWebOutputIO() supported host seams', () => {
  it('joins path segments with forward slashes and keeps URL schemes intact', () => {
    const io = createWebOutputIO();
    expect(io.joinPath('assets/', '/themes', 'dark.json')).toBe('assets/themes/dark.json');
    expect(io.joinPath('https://example.test/', 'a', '', 'b')).toBe('https://example.test/a/b');
    expect(io.joinPath('/', 'a')).toBe('/a');
    expect(io.joinPath()).toBe('');
  });

  it('runs intervals on the injected clock', () => {
    const host = createFakeClockHost();
    const io = createWebOutputIO({ clock: createWebClock({ host }) });
    let ticks = 0;
    const handle = io.setInterval(() => { ticks++; }, 10);
    host.advance(25);
    handle.dispose();
    host.advance(100);
    expect(ticks).toBe(2);
    expect(host.liveTimers()).toBe(0);
  });

  it('forwards resize events from the supplied resize source', () => {
    const runtime = createWebRuntime();
    const io = createWebOutputIO({ resize: (callback) => runtime.onResize(callback) });
    const seen: number[][] = [];
    const handle = io.onResize((columns, rows) => { seen.push([columns, rows]); });
    runtime.resize(100, 30);
    handle.dispose();
    runtime.resize(50, 10);
    expect(seen).toEqual([[100, 30]]);
  });

  it('never fires resize callbacks when no resize source exists', () => {
    const handle = createWebOutputIO().onResize(() => { throw new Error('unexpected resize'); });
    expect(() => { handle.dispose(); }).not.toThrow();
  });
});
