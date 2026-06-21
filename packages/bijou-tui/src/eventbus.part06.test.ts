import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from './eventbus.js';
import type { Cmd } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

describe('runCmd', () => {
  it('routes command backpressure hook failures through onError', async () => {
      const onError = vi.fn();
      const bus = createEventBus<TestMsg>({
        commandBackpressureThreshold: 1,
        onCommandBackpressure() {
          throw new Error('backpressure reporter failed');
        },
        onError,
      });

      bus.runCmd(() => undefined);
      await bus.drain();

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('onCommandBackpressure handler threw'),
        expect.any(Error),
      );
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('pending; max'),
        expect.objectContaining({ pendingCommands: 1, backpressureThreshold: 1 }),
      );
    });

  it('disposes cleanup results that settle after the bus is already disposed', async () => {
      const bus = createEventBus<TestMsg>();
      const dispose = vi.fn();
      let resolveCleanup: ((value: { dispose(): void }) => void) | undefined;

      const cmd: Cmd<TestMsg> = () => new Promise((resolve) => {
        resolveCleanup = resolve;
      });

      bus.runCmd(cmd);
      bus.dispose();
      resolveCleanup?.({ dispose });
      await Promise.resolve();

      expect(dispose).toHaveBeenCalledTimes(1);
    });

  it('surfaces rejected commands through onCommandRejected', async () => {
      const onCommandRejected = vi.fn();
      const bus = createEventBus<TestMsg>({ onCommandRejected });

      bus.runCmd(() => Promise.reject(new Error('boom')));

      await bus.drain();
      expect(onCommandRejected).toHaveBeenCalledTimes(1);
      const rejection: unknown = onCommandRejected.mock.calls[0]?.[0];
      expect(rejection).toBeInstanceOf(Error);
      if (!(rejection instanceof Error)) throw new Error('expected rejection');
      expect(rejection.message).toBe('boom');
    });

  it('routes both errors through onError if onCommandRejected throws', async () => {
      const onCommandRejected = vi.fn(() => {
        throw new Error('report failed');
      });
      const onError = vi.fn();
      const bus = createEventBus<TestMsg>({ onCommandRejected, onError });
      bus.runCmd(() => Promise.reject(new Error('boom')));

      await bus.drain();
      expect(onError).toHaveBeenCalledTimes(2);
      expect(onCommandRejected).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0]).toContain('[EventBus] onCommandRejected handler threw:');
      expect(onError.mock.calls[1]?.[0]).toContain('[EventBus] Original command rejection:');
    });

  it('routes rejected commands through onError when no rejection handler is configured', async () => {
      const onError = vi.fn();
      const bus = createEventBus<TestMsg>({ onError });
      bus.runCmd(() => Promise.reject(new Error('boom')));

      await bus.drain();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0]).toContain('[EventBus] Command rejected:');
      expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
    });

  it('settles drain when a command throws synchronously', async () => {
      const onError = vi.fn();
      const bus = createEventBus<TestMsg>({ onError });

      bus.runCmd(() => {
        throw new Error('sync boom');
      });

      await bus.drain();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0]).toContain('[EventBus] Command rejected:');
      expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
    });

  it('does not throw unhandled rejection when onError itself throws', async () => {
      const throwingOnError = vi.fn(() => {
        throw new Error('onError blew up');
      });
      const bus = createEventBus<TestMsg>({ onError: throwingOnError });
      bus.runCmd(() => Promise.reject(new Error('boom')));

      await bus.drain();
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
      bus.runCmd(() => Promise.reject(new Error('boom')));

      await bus.drain();
      expect(throwingRejected).toHaveBeenCalledTimes(1);
      expect(throwingOnError).toHaveBeenCalled();
    });

  it('silently drops rejected commands when no handlers are configured', async () => {
      const bus = createEventBus<TestMsg>();
      bus.runCmd(() => Promise.reject(new Error('boom')));

      await expect(bus.drain()).resolves.toBeUndefined();
    });
});
