import { describe, expect, it, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';

interface TestMsg {
  readonly type: 'custom';
  readonly value: number;
}

describe('event-bus subscriber isolation', () => {
  it('reports one subscriber failure and continues fan-out', () => {
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ onError });
    const received: BusMsg<TestMsg>[] = [];
    bus.on(() => {
      throw new Error('subscriber failed');
    });
    bus.on((message) => {
      received.push(message);
    });
    bus.use((message, next) => {
      next(message);
    });

    bus.emit({ type: 'custom', value: 42 });

    expect(received).toEqual([{ type: 'custom', value: 42 }]);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      '[EventBus] Subscriber threw:',
      expect.objectContaining({ message: 'subscriber failed' }),
    );
  });
});
