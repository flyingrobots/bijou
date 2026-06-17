import {
  createTestContext,
  describe,
  expect,
  it,
  run,
  counterApp,
  _resetDefaultContextForTesting,
} from './runtime.test-support.js';

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
});
