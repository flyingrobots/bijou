import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

// ---------------------------------------------------------------------------
// middleware
// ---------------------------------------------------------------------------

describe('middleware', () => {
  it('intercepts messages', () => {
    const bus = createEventBus<TestMsg>();
    const received: BusMsg<TestMsg>[] = [];
    bus.on((msg) => received.push(msg));

    const mw = vi.fn((msg: BusMsg<TestMsg>, next: (msg: BusMsg<TestMsg>) => void) => {
      next(msg);
    });
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
