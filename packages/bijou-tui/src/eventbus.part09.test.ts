import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import { QUIT } from './types.js';
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
    bus.runCmd(() => QUIT);
    await bus.drain();
    expect(received).toHaveLength(0);
    expect(quitCalled).not.toHaveBeenCalled();
  });
});
