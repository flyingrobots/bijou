
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
  makeLongContent,
  makePage,
  QUIT,
  runScript,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('dispatches page keymap actions into page update', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: 'x' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('can prefer page key bindings over frame scroll bindings', async () => {
    const page: FramePage<PageModel, Msg> = {
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
        render: () => textView(makeLongContent('home:main')),
      }),
      keyMap: createKeyMap<Msg>().bind('l', 'Increment', { type: 'inc' }),
    };
    const app = createFramedApp({
      pages: [page],
      keyPriority: 'page-first',
    });
    const result = await runScript(app, [{ key: 'l' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.scrollByPage.home?.main?.x ?? 0).toBe(0);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

const commandRuntime = {
    onPulse: () => ({ dispose: () => undefined }),
    sleep: () => Promise.resolve(),
    now: () => 0,
  };

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('warns when frame-first key priority shadows page bindings', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
      keyMap: createKeyMap<Msg>().bind('?', 'Ask page', { type: 'noop' }),
    };
    const app = createFramedApp({
      pages: [page],
    });
    const [initialModel, initCmds] = app.init();
    let model = initialModel;
    expect(initCmds).toHaveLength(0);
    const [nextModel, cmds] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = nextModel;
    expect(model.helpOpen).toBe(true);
    expect(cmds).toHaveLength(1);
    const warningMsg = await cmds[0]?.(() => undefined, commandRuntime);
    if (warningMsg == null || warningMsg === QUIT || isCmdCleanup(warningMsg)) {
      throw new Error('expected runtime warning message');
    }
    const [warnedModel] = app.update(warningMsg, model);
    expect(warnedModel.runtimeNotifications.items).toHaveLength(1);
    expect(warnedModel.runtimeNotifications.items[0]?.message).toContain('Page "home" key binding ?');
    expect(warnedModel.runtimeNotifications.items[0]?.message).toContain('?');
    expect(warnedModel.runtimeNotifications.items[0]?.message).toContain('"Ask page"');
    expect(warnedModel.runtimeNotifications.items[0]?.message).toContain('"Toggle help"');
  });
});
