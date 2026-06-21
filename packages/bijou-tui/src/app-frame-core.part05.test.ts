
import {
  afterAll,
  beforeAll,
  collectCommandMessages,
  createFramedApp,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  normalizeViewOutput,
  setDefaultContext,
  surfaceToString,
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

it('keeps the footer visible while repeated Tab gestures traverse panes', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
    };
    const app = createFramedApp({
      title: 'Test',
      pages: [page],
    });
    const tab = { type: 'key' as const, key: 'tab', ctrl: false, alt: false, shift: false };

    const [model] = app.init();
    const [afterSingleTab, singleTabCmds] = app.update(tab, model);

    expect(afterSingleTab.focusedPaneByPage.home).toBe('right');
    expect(afterSingleTab.footerVisible).toBe(true);
    expect(afterSingleTab.footerTranslateY).toBe(0);
    expect(singleTabCmds).toHaveLength(0);

    const [afterRepeatedTab, repeatedTabCmds] = app.update(tab, afterSingleTab);

    expect(afterRepeatedTab.focusedPaneByPage.home).toBe('left');
    expect(afterRepeatedTab.footerVisible).toBe(true);
    expect(afterRepeatedTab.footerTranslateY).toBe(0);
    expect(repeatedTabCmds).toHaveLength(0);
    expect(surfaceToString(
      normalizeViewOutput(
        app.view(afterRepeatedTab),
        { width: afterRepeatedTab.columns, height: afterRepeatedTab.rows },
      ).surface,
      testCtx.style,
    )).toContain('[NORMAL]');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('triggers transition animation when switching tabs', async () => {
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'wipe',
      transitionDuration: 10,
    });

    const [initModel] = app.init();
    expect(initModel.activePageId).toBe('p1');

    // Trigger tab switch
    const [switchedModel, switchCmds] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    expect(switchedModel.activePageId).toBe('p2');
    expect(switchedModel.previousPageId).toBe('p1');
    expect(switchedModel.transitionProgress).toBe(0);
    expect(switchCmds.length).toBe(1);

    const transitionCmd = switchCmds[0];
    if (transitionCmd == null) {
      throw new Error('expected transition command');
    }
    const messages = await collectCommandMessages(
      transitionCmd,
      Array.from({ length: 10 }, () => 0.002),
    );

    expect(messages.length).toBeGreaterThan(0);

    let model = switchedModel;
    for (const m of messages) {
      const [nextModel] = app.update(m, model);
      model = nextModel;
    }

    expect(model.activePageId).toBe('p2');
    expect(model.previousPageId).toBeUndefined();
    expect(model.transitionProgress).toBe(1);
  });
});
