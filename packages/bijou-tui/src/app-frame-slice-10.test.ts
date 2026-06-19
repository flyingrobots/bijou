import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  hitTestNotificationStack,
  it,
  KEY_DOWN,
  KEY_ESCAPE,
  makePage,
  runScript,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  FramePage, MouseMsg, Msg, must,
  isCmdCleanup, QUIT,
} from './app-frame.test-support.js';
describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('treats frame-managed runtime notifications as dismiss-only mouse targets', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'warning',
      source: 'runtime',
      message: 'Framework warning',
      atMs: 0,
    });
    if (runtimeMsg == null) throw new Error('expected runtime issue message');
    const [nextModel, cmds] = app.update(runtimeMsg, model);
    const tickMsg = await cmds[0]?.(() => undefined, {
      onPulse: () => ({ dispose: () => undefined }),
      sleep: () => Promise.resolve(),
      now: () => 200,
    });
    if (tickMsg === undefined || tickMsg === QUIT || isCmdCleanup(tickMsg)) throw new Error('expected notification tick message');
    const [visibleModel] = app.update(tickMsg, nextModel);
    let dismissMouse: MouseMsg | undefined;
    let sawActionTarget = false;
    for (let row = 0; row < visibleModel.rows; row++) {
      for (let col = 0; col < visibleModel.columns; col++) {
        const target = hitTestNotificationStack(visibleModel.runtimeNotifications, {
          screenWidth: visibleModel.columns,
          screenHeight: visibleModel.rows,
          margin: 1,
          gap: 1,
          ctx: testCtx,
        }, col, row);
        if (target?.kind === 'action') sawActionTarget = true;
        if (target?.kind === 'dismiss' && dismissMouse == null) {
          dismissMouse = {
            type: 'mouse',
            action: 'press',
            button: 'left',
            col,
            row,
            shift: false,
            alt: false,
            ctrl: false,
          };
        }
      }
    }
    expect(sawActionTarget).toBe(false);
    const [dismissedModel] = app.update(must(dismissMouse), visibleModel);
    expect(dismissedModel.runtimeNotifications.items).toHaveLength(1);
    expect(dismissedModel.runtimeNotifications.items[0]?.phase).toBe('exiting');
    expect(dismissedModel.runtimeNotificationLoopActive).toBe(true);
  }, 10000);
  it('treats modal keymaps as exclusive while a page modal is open', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0, modalOpen: true }, []],
        update(msg, model) {
          if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
          if (msg.type === 'noop') return [model, []];
          return [model, []];
        },
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => textView('modal page'),
        }),
        keyMap: createKeyMap<Msg>()
          .bind('x', 'Increment', { type: 'inc' }),
        modalKeyMap(model) {
          if (!model.modalOpen) return undefined;
          return createKeyMap<Msg>()
            .bind('escape', 'Close modal', { type: 'noop' });
        },
      }],
    });
    const result = await runScript(app, [
      { key: 'x' },
      { key: ']' },
      { key: KEY_ESCAPE },
    ]);
    expect(result.model.activePageId).toBe('home');
    expect(result.model.pageModels.home?.count).toBe(0);
  });
  it('keeps pane keymaps inactive while a page modal is open', async () => {
    type PaneMsg = { type: 'pane-hit' } | { type: 'close-modal' };
    const page: FramePage<{ paneHits: number; modalOpen: boolean }, PaneMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ paneHits: 0, modalOpen: true }, []],
      update(msg, model) {
        if (msg.type === 'pane-hit') return [{ ...model, paneHits: model.paneHits + 1 }, []];
        if (msg.type === 'close-modal') return [{ ...model, modalOpen: false }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
      modalKeyMap(model) {
        if (!model.modalOpen) return undefined;
        return createKeyMap<PaneMsg>().bind('escape', 'Close modal', { type: 'close-modal' });
      },
      inputAreas: () => [{
        paneId: 'left',
        keyMap: createKeyMap<PaneMsg>().bind('down', 'Pane hit', { type: 'pane-hit' }),
      }],
    };
    const app = createFramedApp({ pages: [page] });
    const result = await runScript(app, [
      { key: KEY_DOWN },
      { key: KEY_ESCAPE },
      { key: KEY_DOWN },
    ]);
    expect(result.model.pageModels.home?.modalOpen).toBe(false);
    expect(result.model.pageModels.home?.paneHits).toBe(1);
  });
});
