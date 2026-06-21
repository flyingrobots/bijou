import {
  afterAll,
  beforeAll,
  createFramedApp,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
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

  it('quits in pipe mode instead of opening quit confirm', async () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    setDefaultContext(pipeCtx);
    try {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
      });

      const [model] = app.init();
      const [nextModel, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(nextModel.quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(1);

      const returned = await cmds[0]?.(() => undefined, {
        onPulse() {
          return { dispose: () => undefined };
        },
      });
      expect(returned).toBe(QUIT);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('focuses the hovered pane and scrolls it with the mouse wheel', async () => {
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left')) },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right')) },
      }),
    };

    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 20,
      pages: [splitPage],
    });

    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'none',
        action: 'scroll-down',
        col: 60,
        row: 6,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);

    expect(result.model.focusedPaneByPage.home).toBe('right');
    expect(result.model.scrollByPage.home?.right?.y).toBe(1);
  });
});
