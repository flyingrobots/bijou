import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createEventBus } from './eventbus.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import { enterRuntimeCrashMode } from './runtime-crash.js';
import { createRuntimeSession } from './runtime-startup.js';

describe('runtime crash mode', () => {
  it('ignores secondary crash signals without emitting duplicate output', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const session = createRuntimeSession({ count: 0 });
    const buffers = new RuntimeFramebuffers(40, 12);
    const bus = createEventBus({ clock: ctx.clock });
    const first = new Error('first crash');

    enterRuntimeCrashMode(
      'render',
      first,
      session.model,
      session,
      buffers,
      ctx,
      bus,
      () => ({ columns: 40, rows: 12 }),
      () => undefined,
    );
    enterRuntimeCrashMode(
      'update',
      new Error('secondary crash'),
      session.model,
      session,
      buffers,
      ctx,
      bus,
      () => ({ columns: 40, rows: 12 }),
      () => undefined,
    );

    expect(ctx.io.writtenErr).toHaveLength(1);
    expect(session.fatalError).toBe(first);
  });
});
