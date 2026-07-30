import {
  createSurface,
} from '@flyingrobots/bijou';
import {
  createTestContext,
  describe,
  expect,
  it,
  run,
  counterApp,
  _resetDefaultContextForTesting,
} from './runtime.test-support.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import {
  createRuntimeSession,
  synchronizeInitialViewport,
} from './runtime-startup.js';
import type { App } from './types.js';

describe('run', () => {
  it('throws an actionable startup error when no ctx or ambient default is available', async () => {
    _resetDefaultContextForTesting();

    await expect(run(counterApp())).rejects.toThrow(
      'Import @flyingrobots/bijou-node to register Node auto-init, call startApp(app), or call setDefaultContext() explicitly.',
    );
    await expect(run(counterApp())).rejects.toThrow(
      'https://github.com/flyingrobots/bijou/tree/main/packages/bijou-node/GUIDE.md#basic-setup',
    );
  });

  describe('non-interactive mode', () => {
    it('renders once in pipe mode and returns', async () => {
      const ctx = createTestContext({ mode: 'pipe' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });

    it('renders once in static mode and returns', async () => {
      const ctx = createTestContext({ mode: 'static' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });

    it('renders once in accessible mode and returns', async () => {
      const ctx = createTestContext({ mode: 'accessible' });
      await run(counterApp(), { ctx });
      expect(ctx.io.written).toEqual(['count: 0']);
    });
  });

  it('preserves the crash surface when initial resize handling fails', () => {
    const app: App<{ count: number }> = {
      init: () => [{ count: 0 }, []],
      update: () => {
        throw new Error('resize failed');
      },
      view: () => createSurface(10, 4),
    };
    const session = createRuntimeSession({ count: 0 });
    const buffers = new RuntimeFramebuffers(10, 4);
    const crashSurface = createSurface(10, 4);

    synchronizeInitialViewport(
      app,
      session,
      () => ({ columns: 10, rows: 4 }),
      buffers,
      () => {
        buffers.replaceFront(crashSurface);
      },
    );

    expect(buffers.current).toBe(crashSurface);
  });
});
