import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  isCmdCleanup,
  it,
  makePage,
  QUIT,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  const commandHooks = (now: number) => ({ onPulse: () => ({ dispose: () => undefined }), sleep: () => Promise.resolve(), now: () => now });

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('renders routed runtime issues through frame-managed notifications', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'error',
      source: 'command',
      message: 'Command rejected: worker crashed during boot',
      atMs: 0,
    });

    if (runtimeMsg == null) throw new Error('expected runtime issue message');

    const [nextModel, cmds] = app.update(runtimeMsg, model);
    const tickMsg = await must(cmds[0])(() => undefined, commandHooks(200));

    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(tickMsg).toBeDefined();

    if (tickMsg === undefined || tickMsg === QUIT || isCmdCleanup(tickMsg)) throw new Error('expected msg');

    const [visibleModel] = app.update(tickMsg, nextModel);
    const frame = app.view(visibleModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const rendered = surfaceToString(frame, testCtx.style);
    expect(rendered).toContain('Command rejected: worker crashed during boot');
    expect(cmds).toHaveLength(1);
  });
});
