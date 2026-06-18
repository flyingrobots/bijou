import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  isCmdCleanup,
  it,
  makeLongContent,
  makePage,
  mouseMove,
  mousePress,
  mouseRelease,
  QUIT,
  runScript,
  setDefaultContext,
  surfaceToString,
  textView,
  tick,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  FramedAppMsg,
  MouseMsg,
  Msg,
  PageModel,
} from './app-frame.test-support.js';
import { must } from '@flyingrobots/bijou/adapters/test';
describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('respects transitionOverride to select animation dynamically', async () => {
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'none',
      transitionOverride: () => 'wipe',
      transitionDuration: 10,
    });
    const [initModel] = app.init();
    const [switchedModel] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    expect(switchedModel.activeTransition).toBe('wipe');
    expect(switchedModel.transitionProgress).toBe(0);
  });
  it('throws for duplicate pane ids in a page layout', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'split',
          splitId: 'dup',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'main', render: () => textView('left') },
          paneB: { kind: 'pane', paneId: 'main', render: () => textView('right') },
        }),
      }],
    });
    expect(() => app.init()).toThrow(/duplicate paneId "main"/);
  });
  it('collects pane ids from declared grid areas only', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'grid',
          gridId: 'g',
          columns: ['1fr'],
          rows: ['1fr'],
          areas: ['main'],
          cells: {
            main: { kind: 'pane', paneId: 'main', render: () => textView('main') },
            ghost: { kind: 'pane', paneId: 'ghost', render: () => textView('ghost') },
          },
        }),
      }],
    });
    const [model] = app.init();
    expect(model.focusedPaneByPage.home).toBe('main');
    expect(model.scrollByPage.home?.ghost).toBeUndefined();
  });
  it('dispatches page keymap actions into page update', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: 'x' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
  });
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
    let [model, initCmds] = app.init();
    expect(initCmds).toHaveLength(0);
    const [nextModel, cmds] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = nextModel;
    expect(model.helpOpen).toBe(true);
    expect(cmds).toHaveLength(1);
    const warningMsg = await cmds[0]?.(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 0,
    });
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
  it('warns only once per page for frame-first binding collisions', async () => {
    const page = (id: string, title: string): FramePage<PageModel, Msg> => ({
      id,
      title,
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(title),
      }),
      keyMap: createKeyMap<Msg>().bind('?', `${title} help`, { type: 'noop' }),
    });
    const app = createFramedApp({
      pages: [page('home', 'Home'), page('logs', 'Logs')],
    });
    let [model, initCmds] = app.init();
    expect(initCmds).toHaveLength(0);
    let update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(update[1]).toHaveLength(1);
    const homeWarning = await update[1][0]?.(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 0,
    });
    if (homeWarning == null || homeWarning === QUIT || isCmdCleanup(homeWarning)) {
      throw new Error('expected home collision warning');
    }
    [model] = app.update(homeWarning, model);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    update = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('logs');
    expect(update[1]).toHaveLength(0);
    update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(update[1]).toHaveLength(1);
    const logsWarning = await update[1][0]?.(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 0,
    });
    if (logsWarning == null || logsWarning === QUIT || isCmdCleanup(logsWarning)) {
      throw new Error('expected logs collision warning');
    }
    [model] = app.update(logsWarning, model);
    expect(model.runtimeNotifications.items).toHaveLength(2);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    update = app.update({ type: 'key', key: '[', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('home');
    expect(update[1]).toHaveLength(0);
    update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    expect(update[1]).toHaveLength(0);
  });
  it('can override the short help strip with page bindings only', async () => {
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
        render: () => textView('home'),
      }),
      keyMap: createKeyMap<Msg>()
        .bind('l', 'Cycle placement', { type: 'inc' })
        .bind('q', 'Quit demo', { type: 'noop' }),
    };
    const app = createFramedApp({
      title: 'Test',
      pages: [page],
      helpLineSource: ({ activePage }) => activePage.keyMap,
    });
    const result = await runScript(app, []);
    const frame = surfaceToString(must(result.frames.at(-1)), testCtx.style);
    expect(frame).toContain('l Cycle placement');
    expect(frame).toContain('q Quit demo');
    expect(frame).not.toContain('[ Previous tab');
    expect(frame).not.toContain('Tab Next pane');
  });
  it('keeps init command messages scoped to their originating page', async () => {
    const initInc: Cmd<Msg> = async () => ({ type: 'inc' });
    const page = (id: string, title: string): FramePage<PageModel, Msg> => ({
      id,
      title,
      init: () => [{ count: 0 }, [initInc]],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(`${id} pane`),
      }),
    });
    const app = createFramedApp({
      pages: [page('home', 'Home'), page('logs', 'Logs')],
    });
    const result = await runScript(app, []);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.pageModels.logs?.count).toBe(1);
  });
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
    let [model, initCmds] = app.init();
    expect(initCmds).toHaveLength(0);
    let update = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('logs');
    update = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    const noopCmd = update[1][0];
    expect(noopCmd).toBeDefined();
    const noopResult = await must(noopCmd)(() => {}, {
      onPulse: () => ({ dispose() {} }),
    });
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
    const delayedPromise = must(delayedCmd)((msg) => emitted.push(msg), {
      onPulse: () => ({ dispose() {} }),
      sleep: () => Promise.resolve(),
    });
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
  it('supports Shift+G for scroll-to-bottom', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: 'G' }]);
    expect(result.model.scrollByPage.home?.main?.y).toBeGreaterThan(0);
  });
  it('forwards unmapped workspace mouse messages to the active page', async () => {
    type MsgWithMouse = Msg | MouseMsg;
    const seenMouseActions: string[] = [];
    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          seenMouseActions.push(`${msg.button}:${msg.action}:${msg.col}:${msg.row}`);
          return [model, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      keyMap: createKeyMap<MsgWithMouse>().bind('x', 'Increment', { type: 'inc' }),
    };
    const app = createFramedApp<PageModel, MsgWithMouse>({ pages: [page] });
    const result = await runScript(app, [
      mouseMove(4, 2),
      mouseRelease('left', 5, 3),
      mousePress('right', 6, 4),
      mousePress('left', 7, 5),
      { key: 'x' },
    ]);
    expect(seenMouseActions).toEqual([
      'none:move:4:2',
      'left:release:5:3',
      'right:press:6:4',
      'left:press:7:5',
    ]);
    expect(result.model.pageModels.home?.count).toBe(1);
  });
});
