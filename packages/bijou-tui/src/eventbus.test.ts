import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import type { Cmd } from './types.js';
import { QUIT, isKeyMsg, isMouseMsg, isResizeMsg } from './types.js';
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

  it('surfaces rejected commands through onCommandRejected', async () => {
    const onCommandRejected = vi.fn();
    const bus = createEventBus<TestMsg>({ onCommandRejected });

    bus.runCmd(async () => {
      throw new Error('boom');
    });

    await vi.waitFor(() => expect(onCommandRejected).toHaveBeenCalledTimes(1));
    expect(onCommandRejected.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect((onCommandRejected.mock.calls[0]?.[0] as Error).message).toBe('boom');
  });

  it('routes both errors through onError if onCommandRejected throws', async () => {
    const onCommandRejected = vi.fn(() => {
      throw new Error('report failed');
    });
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ onCommandRejected, onError });
    bus.runCmd(async () => {
      throw new Error('boom');
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
    expect(onCommandRejected).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toContain('[EventBus] onCommandRejected handler threw:');
    expect(onError.mock.calls[1]?.[0]).toContain('[EventBus] Original command rejection:');
  });

  it('routes rejected commands through onError when no rejection handler is configured', async () => {
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ onError });
    bus.runCmd(async () => {
      throw new Error('boom');
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0]?.[0]).toContain('[EventBus] Command rejected:');
    expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
  });

  it('does not throw unhandled rejection when onError itself throws', async () => {
    const throwingOnError = vi.fn(() => {
      throw new Error('onError blew up');
    });
    const bus = createEventBus<TestMsg>({ onError: throwingOnError });
    bus.runCmd(async () => {
      throw new Error('boom');
    });

    // If safeReport is working, the promise settles without unhandled rejection.
    await new Promise((r) => setTimeout(r, 10));
    // onError was called but its throw was swallowed
    expect(throwingOnError).toHaveBeenCalled();
  });

  it('does not throw unhandled rejection when onCommandRejected and onError both throw', async () => {
    const throwingRejected = vi.fn(() => {
      throw new Error('rejected handler blew up');
    });
    const throwingOnError = vi.fn(() => {
      throw new Error('onError blew up');
    });
    const bus = createEventBus<TestMsg>({
      onCommandRejected: throwingRejected,
      onError: throwingOnError,
    });
    bus.runCmd(async () => {
      throw new Error('boom');
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(throwingRejected).toHaveBeenCalledTimes(1);
    // safeReport swallowed the throw from onError
    expect(throwingOnError).toHaveBeenCalled();
  });

  it('silently drops rejected commands when no handlers are configured', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const bus = createEventBus<TestMsg>();
      bus.runCmd(async () => {
        throw new Error('boom');
      });

      // Give the promise time to resolve
      await new Promise((r) => setTimeout(r, 10));
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
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
// middleware
// ---------------------------------------------------------------------------

describe('middleware', () => {
  it('intercepts messages', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const mw = vi.fn((msg, next) => next(msg));
    bus.use(mw);

    bus.emit({ type: 'custom', value: 42 });
    expect(mw).toHaveBeenCalledTimes(1);
    expect(received[0]).toEqual({ type: 'custom', value: 42 });
  });

  it('can modify messages', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.use((msg, next) => {
      if (msg.type === 'custom') {
        next({ ...msg, value: msg.value * 2 });
      } else {
        next(msg);
      }
    });

    bus.emit({ type: 'custom', value: 21 });
    expect(received[0]).toEqual({ type: 'custom', value: 42 });
  });

  it('can halt message propagation', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.use((msg, next) => {
      if (msg.type === 'custom' && msg.value === 0) {
        // Halt! Don't call next()
        return;
      }
      next(msg);
    });

    bus.emit({ type: 'custom', value: 0 });
    bus.emit({ type: 'custom', value: 1 });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ type: 'custom', value: 1 });
  });

  it('chains multiple middleware in order', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const log: string[] = [];
    bus.use((msg, next) => { log.push('first'); next(msg); });
    bus.use((msg, next) => { log.push('second'); next(msg); });

    bus.emit({ type: 'custom', value: 1 });
    expect(log).toEqual(['first', 'second']);
  });

  it('handles middleware errors gracefully', () => {
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ onError });
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    bus.use(() => { throw new Error('mw boom'); });

    bus.emit({ type: 'custom', value: 1 });
    
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Middleware threw'), expect.anything());
    // Should still deliver original message if middleware fails
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ type: 'custom', value: 1 });
  });

  it('removes middleware on dispose', () => {
    const bus = createEventBus<TestMsg>();
    const log: string[] = [];
    const handle = bus.use((msg, next) => { log.push('hit'); next(msg); });

    bus.emit({ type: 'custom', value: 1 });
    handle.dispose();
    bus.emit({ type: 'custom', value: 2 });

    expect(log).toEqual(['hit']);
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
