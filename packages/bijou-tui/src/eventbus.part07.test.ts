import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from './eventbus.js';
import type { Cmd } from './types.js';
import { QUIT } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestMsg { type: 'custom'; value: number }

// ---------------------------------------------------------------------------
// onQuit
// ---------------------------------------------------------------------------

describe('onQuit', () => {
  it('disposed quit handler stops firing', async () => {
    const bus = createEventBus<TestMsg>();
    const quitCalled = vi.fn();
    const handle = bus.onQuit(quitCalled);
    handle.dispose();

    const cmd: Cmd<TestMsg> = () => QUIT;
    bus.runCmd(cmd);

    await bus.drain();
    expect(quitCalled).not.toHaveBeenCalled();
  });
});
