import { describe, expect, it, vi } from 'vitest';
import { mockClock } from '@flyingrobots/bijou/adapters/test';
import { createEventBus, type BusMsg } from './eventbus.js';
import { QUIT } from './types.js';

interface TestMsg {
  readonly type: 'custom';
  readonly value: number;
}

class ObservedPromise extends Promise<undefined> {
  thenCalls = 0;

  override then<TResult1 = undefined, TResult2 = never>(
    onfulfilled?: (
      (value: undefined) => TResult1 | PromiseLike<TResult1>
    ) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.thenCalls += 1;
    return super.then(onfulfilled, onrejected);
  }
}

describe('event-bus subscriber isolation', () => {
  it('consumes asynchronous error-reporter failures', async () => {
    let rejectReport: ((reason: unknown) => void) | undefined;
    const rejectedReport = new ObservedPromise((_resolve, reject) => {
      rejectReport = reject;
    });
    const options = {};
    Object.defineProperty(options, 'onError', {
      value: () => rejectedReport,
    });
    const bus = createEventBus<TestMsg>(options);
    bus.on(() => {
      throw new Error('subscriber failed');
    });

    bus.emit({ type: 'custom', value: 42 });
    await Promise.resolve();
    expect(rejectedReport.thenCalls).toBe(1);

    rejectReport?.(new Error('reporter failed'));
    await Promise.resolve();
    await Promise.resolve();
  });

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

  it('reports one quit failure and continues quit fan-out', async () => {
    const onCommandRejected = vi.fn();
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ onCommandRejected, onError });
    const received = vi.fn();
    bus.onQuit(() => {
      throw new Error('quit subscriber failed');
    });
    bus.onQuit(received);

    bus.runCmd(() => QUIT);
    await bus.drain();

    expect(received).toHaveBeenCalledOnce();
    expect(onCommandRejected).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      '[EventBus] Quit subscriber threw:',
      expect.objectContaining({ message: 'quit subscriber failed' }),
    );
  });

  it('reports one pulse failure and continues pulse fan-out', () => {
    const clock = mockClock();
    const onError = vi.fn();
    const bus = createEventBus<TestMsg>({ clock, onError });
    const received = vi.fn();
    bus.onPulse(() => {
      throw new Error('pulse subscriber failed');
    });
    bus.onPulse(received);

    bus.startPulse(60);
    clock.advanceBy(17);

    expect(received).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      '[EventBus] Pulse subscriber threw:',
      expect.objectContaining({ message: 'pulse subscriber failed' }),
    );
  });
});
