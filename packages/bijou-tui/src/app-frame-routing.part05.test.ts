import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  isCmdCleanup,
  it,
  QUIT,
  setDefaultContext,
  textView,
  tick,
  _resetDefaultContextForTesting,
  FramePage,
  FramedAppMsg,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  const commandRuntime = {
    onPulse: () => ({ dispose: () => undefined }),
    sleep: () => Promise.resolve(),
    now: () => 0,
  };

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('routes delayed page commands back to the originating page after tab switches', async () => {
    const home: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };
    const logs: FramePage<PageModel, Msg> = {
      id: 'logs',
      title: 'Logs',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        if (msg.type === 'noop') {
          return [model, [tick(10, { type: 'inc' })]];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('logs'),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Delayed increment', { type: 'noop' }),
    };
    const app = createFramedApp({
      pages: [home, logs],
    });
    const [initialModel, initCmds] = app.init();
    let model = initialModel;
    expect(initCmds).toHaveLength(0);
    let update = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('logs');
    update = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    const noopCmd = update[1][0];
    expect(noopCmd).toBeDefined();
    const noopResult = await must(noopCmd)(() => undefined, commandRuntime);
    expect(noopResult).toBeDefined();
    expect(noopResult).not.toBe(QUIT);
    if (noopResult === undefined || noopResult === QUIT) {
      throw new Error('expected a scoped noop result');
    }
    if (isCmdCleanup(noopResult)) {
      throw new Error('expected delayed page command to resolve to a framed message');
    }
    update = app.update(noopResult, model);
    model = update[0];
    const delayedCmd = update[1][0];
    expect(delayedCmd).toBeDefined();
    const emitted: FramedAppMsg<Msg>[] = [];
    const delayedPromise = must(delayedCmd)((msg) => {
      emitted.push(msg);
    }, commandRuntime);
    update = app.update({ type: 'key', key: '[', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('home');
    const returned = await delayedPromise;
    for (const msg of emitted) {
      update = app.update(msg, model);
      model = update[0];
    }
    if (returned !== undefined && returned !== QUIT && !isCmdCleanup(returned)) {
      update = app.update(returned, model);
      model = update[0];
    }
    expect(model.pageModels.home?.count).toBe(0);
    expect(model.pageModels.logs?.count).toBe(1);
  });
});
