import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  makePage,
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

  it('lets help scroll with frame scroll keys when the overlay is taller than the viewport', () => {
    const tallHelpPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      keyMap: createKeyMap<Msg>()
        .group('Extra', (group) => {
          let next = group;
          for (let index = 0; index < 32; index++) {
            next = next.bind(String(index % 10), `Binding ${String(index)}`, { type: 'noop' });
          }
          return next;
        }),
    };
    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 16,
      pages: [tallHelpPage],
    });
    let [model] = app.init();
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(true);
    expect('helpScrollY' in model && typeof model.helpScrollY === 'number' && model.helpScrollY > 0).toBe(true);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('treats help as modal and ignores non-close keys', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      globalKeys: createKeyMap<Msg>().bind('z', 'Increment', { type: 'inc' }),
      enableCommandPalette: true,
    });
    const result = await runScript(app, [
      { key: '?' },
      { key: 'z' },
      { key: KEY_CTRL_P }, // ctrl+p should be ignored while help is open
    ]);
    expect(result.model.helpOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
    expect(result.model.pageModels.home?.count).toBe(0);
  });
});
