
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makeLongContent,
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

it('reuses the last rendered workspace layout when routing mouse wheel input', () => {
    let layoutCalls = 0;
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => {
        layoutCalls += 1;
        return {
          kind: 'split',
          splitId: 's1',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left')) },
          paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right')) },
        };
      },
    };

    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 20,
      pages: [splitPage],
    });

    const [model] = app.init();
    expect(layoutCalls).toBe(1);

    app.view(model);
    expect(layoutCalls).toBe(2);

    const [nextModel] = app.update({
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 60,
      row: 6,
      shift: false,
      alt: false,
      ctrl: false,
    }, model);

    expect(nextModel.focusedPaneByPage.home).toBe('right');
    expect(nextModel.scrollByPage.home?.right?.y).toBe(1);
    expect(layoutCalls).toBe(3);

    app.view(nextModel);
    expect(layoutCalls).toBe(4);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('opens command palette and dispatches selected keymap command', async () => {
    const global = createKeyMap<Msg>()
      .bind('z', 'Zap', { type: 'inc' });

    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      globalKeys: global,
      enableCommandPalette: true,
    });

    // Ctrl+P opens palette. Type "z" to filter to Zap, then Enter.
    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 'z' },
      { key: KEY_ENTER },
    ]);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.commandPalette).toBeUndefined();
  });
});
