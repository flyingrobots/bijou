import { describe, it, expect } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

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
