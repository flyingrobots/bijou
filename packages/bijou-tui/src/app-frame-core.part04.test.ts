
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
  KEY_DOWN,
  KEY_SHIFT_TAB,
  KEY_TAB,
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

it('cycles pane focus with tab and shift+tab', async () => {
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
    };

    const app = createFramedApp({ pages: [splitPage] });
    const result = await runScript(app, [{ key: KEY_TAB }, { key: KEY_SHIFT_TAB }]);
    expect(result.model.focusedPaneByPage.home).toBe('left');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('routes pane keymaps only to the focused pane', async () => {
    type PaneMsg = { type: 'left-hit' } | { type: 'right-hit' };
    interface PaneModel {
      leftHits: number;
      rightHits: number;
    }

    const page: FramePage<PaneModel, PaneMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ leftHits: 0, rightHits: 0 }, []],
      update(msg, model) {
        if (msg.type === 'left-hit') return [{ ...model, leftHits: model.leftHits + 1 }, []];
        if (msg.type === 'right-hit') return [{ ...model, rightHits: model.rightHits + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
      inputAreas: () => [
        {
          paneId: 'left',
          keyMap: createKeyMap<PaneMsg>().bind('down', 'Left hit', { type: 'left-hit' }),
        },
        {
          paneId: 'right',
          keyMap: createKeyMap<PaneMsg>().bind('down', 'Right hit', { type: 'right-hit' }),
        },
      ],
    };

    const app = createFramedApp({ pages: [page] });
    const result = await runScript(app, [
      { key: KEY_DOWN },
      { key: KEY_TAB },
      { key: KEY_DOWN },
    ]);

    expect(result.model.pageModels.home?.leftHits).toBe(1);
    expect(result.model.pageModels.home?.rightHits).toBe(1);
    expect(result.model.focusedPaneByPage.home).toBe('right');
  });
});
