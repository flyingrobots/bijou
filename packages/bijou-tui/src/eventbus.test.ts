import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import type { KeyMsg, ResizeMsg, Cmd } from './types.js';
import { QUIT } from './types.js';
import type { IOPort, RawInputHandle } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

type TestMsg = { type: 'custom'; value: number };

/** Minimal mock IOPort for bus tests. */
function createMockIO(): {
  io: IOPort;
  simulateKey: (raw: string) => void;
  simulateResize: (cols: number, rows: number) => void;
} {
  let keyHandler: ((raw: string) => void) | null = null;
  let resizeHandler: ((cols: number, rows: number) => void) | null = null;

  const io: IOPort = {
    write: vi.fn(),
    question: vi.fn(() => Promise.resolve('')),
    rawInput(onKey) {
      keyHandler = onKey;
      return { dispose() { keyHandler = null; } };
    },
    onResize(callback) {
      resizeHandler = callback;
      return { dispose() { resizeHandler = null; } };
    },
    setInterval: vi.fn(() => ({ dispose: vi.fn() })),
    readFile: vi.fn(() => ''),
    readDir: vi.fn(() => []),
    joinPath: vi.fn((...s: string[]) => s.join('/')),
  };

  return {
    io,
    simulateKey(raw) { keyHandler?.(raw); },
    simulateResize(cols, rows) { resizeHandler?.(cols, rows); },
  };
}

// ---------------------------------------------------------------------------
// emit / on
// ---------------------------------------------------------------------------

describe('emit / on', () => {
  it('delivers messages to subscribers', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.emit({ type: 'custom', value: 42 });
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ type: 'custom', value: 42 });
  });

  it('supports multiple subscribers', () => {
    const bus = createEventBus<TestMsg>();
    const a: BusMsg<TestMsg>[] = [];
    const b: BusMsg<TestMsg>[] = [];
    bus.on((msg) => a.push(msg));
    bus.on((msg) => b.push(msg));

    bus.emit({ type: 'custom', value: 1 });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });

  it('disposed subscriber stops receiving', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    const sub = bus.on((msg) => received.push(msg));

    bus.emit({ type: 'custom', value: 1 });
    sub.dispose();
    bus.emit({ type: 'custom', value: 2 });

    expect(received).toHaveLength(1);
  });

  it('does not deliver after bus is disposed', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.dispose();
    bus.emit({ type: 'custom', value: 1 });

    expect(received).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// connectIO — keyboard
// ---------------------------------------------------------------------------

describe('connectIO keyboard', () => {
  it('parses raw stdin into KeyMsg', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io);
    simulateKey('a');

    expect(received).toHaveLength(1);
    expect((received[0] as KeyMsg).type).toBe('key');
    expect((received[0] as KeyMsg).key).toBe('a');
  });

  it('filters unknown key sequences', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io);
    // Send a mouse event sequence (parsed as unknown)
    simulateKey('\x1b[M !!');

    expect(received).toHaveLength(0);
  });

  it('disconnects on dispose', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const handle = bus.connectIO(io);
    simulateKey('a');
    handle.dispose();
    simulateKey('b');

    expect(received).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// connectIO — resize
// ---------------------------------------------------------------------------

describe('connectIO resize', () => {
  it('emits ResizeMsg on resize', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateResize } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io);
    simulateResize(120, 40);

    expect(received).toHaveLength(1);
    const msg = received[0] as ResizeMsg;
    expect(msg.type).toBe('resize');
    expect(msg.columns).toBe(120);
    expect(msg.rows).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// runCmd
// ---------------------------------------------------------------------------

describe('runCmd', () => {
  it('emits command result as a message', async () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const cmd: Cmd<TestMsg> = async () => ({ type: 'custom' as const, value: 99 });
    bus.runCmd(cmd);

    // Wait for promise to resolve
    await vi.waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toEqual({ type: 'custom', value: 99 });
  });

  it('ignores void/undefined results', async () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const cmd: Cmd<TestMsg> = async () => undefined;
    bus.runCmd(cmd);

    // Give the promise time to resolve
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
  });

  it('fires onQuit for QUIT signals', async () => {
    const bus = createEventBus<TestMsg>();
    const quitCalled = vi.fn();
    bus.onQuit(quitCalled);

    const cmd: Cmd<TestMsg> = async () => QUIT;
    bus.runCmd(cmd);

    await vi.waitFor(() => expect(quitCalled).toHaveBeenCalledTimes(1));
  });

  it('does not emit QUIT as a regular message', async () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));
    bus.onQuit(() => {});

    const cmd: Cmd<TestMsg> = async () => QUIT;
    bus.runCmd(cmd);

    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// onQuit
// ---------------------------------------------------------------------------

describe('onQuit', () => {
  it('disposed quit handler stops firing', async () => {
    const bus = createEventBus<TestMsg>();
    const quitCalled = vi.fn();
    const handle = bus.onQuit(quitCalled);
    handle.dispose();

    const cmd: Cmd<TestMsg> = async () => QUIT;
    bus.runCmd(cmd);

    await new Promise((r) => setTimeout(r, 10));
    expect(quitCalled).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// dispose
// ---------------------------------------------------------------------------

describe('dispose', () => {
  it('disconnects all IO sources', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey, simulateResize } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));
    bus.connectIO(io);

    bus.dispose();
    simulateKey('a');
    simulateResize(100, 50);

    expect(received).toHaveLength(0);
  });

  it('clears all subscribers and quit handlers', async () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    const quitCalled = vi.fn();
    bus.on((msg) => received.push(msg));
    bus.onQuit(quitCalled);

    bus.dispose();
    bus.emit({ type: 'custom', value: 1 });
    bus.runCmd(async () => QUIT);

    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
    expect(quitCalled).not.toHaveBeenCalled();
  });
});
