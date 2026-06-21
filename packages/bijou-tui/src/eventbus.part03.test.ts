import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import { isKeyMsg, isMouseMsg } from './types.js';
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
// connectIO — mouse
// ---------------------------------------------------------------------------

describe('connectIO mouse', () => {
  it('emits MouseMsg when mouse enabled', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io, { mouse: true });
    simulateKey('\x1b[<0;10;20M'); // SGR left click

    expect(received).toHaveLength(1);
    expect(isMouseMsg(received[0])).toBe(true);
    if (isMouseMsg(received[0])) {
      expect(received[0].button).toBe('left');
      expect(received[0].action).toBe('press');
      expect(received[0].col).toBe(9);
      expect(received[0].row).toBe(19);
    }
  });

  it('still emits KeyMsg for keyboard input when mouse enabled', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io, { mouse: true });
    simulateKey('a');

    expect(received).toHaveLength(1);
    expect(isKeyMsg(received[0])).toBe(true);
  });

  it('emits scroll events when mouse enabled', () => {
    const bus = createEventBus<TestMsg>();
    const { io, simulateKey } = createMockIO();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.connectIO(io, { mouse: true });
    simulateKey('\x1b[<64;5;5M'); // scroll up

    expect(received).toHaveLength(1);
    expect(isMouseMsg(received[0])).toBe(true);
    if (isMouseMsg(received[0])) {
      expect(received[0].action).toBe('scroll-up');
    }
  });
});
