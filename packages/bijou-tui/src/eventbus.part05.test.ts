import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import type { Cmd } from './types.js';
import { QUIT } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

describe('runCmd', () => {
  it('emits command result as a message', async () => {
      const bus = createEventBus<TestMsg>();
      const received: BusMsg<TestMsg>[] = [];
      bus.on((msg) => received.push(msg));

      const cmd: Cmd<TestMsg> = () => ({ type: 'custom' as const, value: 99 });
      bus.runCmd(cmd);

      await bus.drain();
      expect(received[0]).toEqual({ type: 'custom', value: 99 });
    });

  it('ignores void/undefined results', async () => {
      const bus = createEventBus<TestMsg>();
      const received: BusMsg<TestMsg>[] = [];
      bus.on((msg) => received.push(msg));

      const cmd: Cmd<TestMsg> = () => undefined;
      bus.runCmd(cmd);

      await bus.drain();
      expect(received).toHaveLength(0);
    });

  it('fires onQuit for QUIT signals', async () => {
      const bus = createEventBus<TestMsg>();
      const quitCalled = vi.fn();
      bus.onQuit(quitCalled);

      const cmd: Cmd<TestMsg> = () => QUIT;
      bus.runCmd(cmd);

      await bus.drain();
      expect(quitCalled).toHaveBeenCalledTimes(1);
    });

  it('does not emit QUIT as a regular message', async () => {
      const bus = createEventBus<TestMsg>();
      const received: BusMsg<TestMsg>[] = [];
      bus.on((msg) => received.push(msg));
      bus.onQuit(() => undefined);

      const cmd: Cmd<TestMsg> = () => QUIT;
      bus.runCmd(cmd);

      await bus.drain();
      expect(received).toHaveLength(0);
    });

  it('retains and disposes cleanup handles returned by commands', async () => {
      const bus = createEventBus<TestMsg>();
      const dispose = vi.fn();

      const cmd: Cmd<TestMsg> = () => ({ dispose });
      bus.runCmd(cmd);

      await bus.drain();
      expect(dispose).not.toHaveBeenCalled();

      bus.dispose();
      expect(dispose).toHaveBeenCalledTimes(1);
    });

  it('supports cleanup function shorthand for long-lived commands', async () => {
      const bus = createEventBus<TestMsg>();
      const cleanup = vi.fn();

      const cmd: Cmd<TestMsg> = () => cleanup;
      bus.runCmd(cmd);

      await bus.drain();
      bus.dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

  it('reports command backpressure when pending commands reach the threshold', async () => {
      const onCommandBackpressure = vi.fn();
      const bus = createEventBus<TestMsg>({
        commandBackpressureThreshold: 2,
        onCommandBackpressure,
      });
      const resolvers: (() => void)[] = [];
      const cmd: Cmd<TestMsg> = () => new Promise<undefined>((resolve) => {
        resolvers.push(() => { resolve(undefined); });
      });

      bus.runCmd(cmd);
      expect(bus.getCommandDiagnostics()).toEqual({
        pendingCommands: 1,
        activeCommandCleanups: 0,
        backpressureThreshold: 2,
      });
      expect(onCommandBackpressure).not.toHaveBeenCalled();

      bus.runCmd(cmd);
      expect(onCommandBackpressure).toHaveBeenCalledTimes(1);
      expect(onCommandBackpressure.mock.calls[0]?.[0]).toMatchObject({
        pendingCommands: 2,
        activeCommandCleanups: 0,
        backpressureThreshold: 2,
      });

      resolvers.forEach((resolve) => { resolve(); });
      await bus.drain();
      expect(bus.getCommandDiagnostics().pendingCommands).toBe(0);
    });

  it('re-arms command backpressure diagnostics after the queue drains below the threshold', async () => {
      const onCommandBackpressure = vi.fn();
      const bus = createEventBus<TestMsg>({
        commandBackpressureThreshold: 1,
        onCommandBackpressure,
      });

      bus.runCmd(() => undefined);
      await bus.drain();
      bus.runCmd(() => undefined);
      await bus.drain();

      expect(onCommandBackpressure).toHaveBeenCalledTimes(2);
    });
});
