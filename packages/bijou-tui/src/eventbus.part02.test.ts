import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import { isKeyMsg } from './types.js';
import type { IOPort } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

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
    writeError: vi.fn(),
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
    expect(isKeyMsg(received[0])).toBe(true);
    if (isKeyMsg(received[0])) {
      expect(received[0].key).toBe('a');
    }
  });

  it('filters unknown key sequences', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io);
    // Send a mouse event sequence (parsed as unknown when mouse disabled)
    simulateKey('\x1b[M !!');

    expect(received).toHaveLength(0);
  });

  it('filters mouse sequences when mouse disabled', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io); // mouse disabled by default
    simulateKey('\x1b[<0;10;20M'); // SGR left click

    expect(received).toHaveLength(0); // parsed as unknown key, filtered
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
