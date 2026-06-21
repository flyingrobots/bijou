import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import { isResizeMsg } from './types.js';
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
    expect(isResizeMsg(received[0])).toBe(true);
    if (isResizeMsg(received[0])) {
      expect(received[0].columns).toBe(120);
      expect(received[0].rows).toBe(40);
    }
  });
});
