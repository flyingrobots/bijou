import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  isCmdCleanup,
  it,
  KEY_CTRL_P,
  KEY_ESCAPE,
  makeLongContent,
  makeModalPage,
  makePage,
  normalizeViewOutput,
  notify,
  QUIT,
  runScript,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  surfaceToString,
  textView,
  tick,
  _resetDefaultContextForTesting,
  Cmd,
  FrameOverlayContext,
  FramePage,
  FramedAppMsg,
  MouseMsg,
  Msg,
  NotificationState,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => setDefaultContext(testCtx));
  afterAll(() => _resetDefaultContextForTesting());

  it('keeps notification-center mouse interactions from leaking through to the underlying page', () => {
    type MsgWithMouse = Msg | MouseMsg;

    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<MsgWithMouse>;
    }

    const page: FramePage<NotificationPageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<MsgWithMouse>(
          Array.from({ length: 20 }, (_, index) => ({
            title: `Notice ${index}`,
            tone: index % 2 === 0 ? 'SUCCESS' : 'WARNING',
          })),
        ),
      }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<NotificationPageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as MsgWithMouse, model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 76,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel as unknown as MsgWithMouse, model);
    const scrolledY = (model as any).notificationCenterScrollY;

    const outsideWheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 10,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(outsideWheel as unknown as MsgWithMouse, model);

    const click: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 76,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click as unknown as MsgWithMouse, model);

    expect((model as any).notificationCenterScrollY).toBe(scrolledY);
    expect(scrolledY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });

  it('keeps drawer mouse interactions from leaking through to the underlying page', async () => {
    type MsgWithMouse = Msg | MouseMsg;

    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: Array.from({ length: 24 }, (_, index) => ({
            id: `setting-${index}`,
            label: `Setting ${index}`,
            valueLabel: index % 2 === 0 ? 'On' : 'Off',
          })),
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(',') as unknown as MsgWithMouse, model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 4,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel as unknown as MsgWithMouse, model);
    const scrolledY = (model as any).settingsScrollY;

    const outsideWheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 60,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(outsideWheel as unknown as MsgWithMouse, model);

    const click: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 4,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click as unknown as MsgWithMouse, model);

    expect((model as any).settingsScrollY).toBe(scrolledY);
    expect(scrolledY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });

  it('lets q remain text input inside the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'q' },
    ]);

    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.quitConfirmOpen).toBe(false);
    expect(result.model.commandPalette?.query).toBe('q');
  });

  it('derives footer hints from the topmost active layer input map', async () => {
    const app = createFramedApp({
      pages: [makeModalPage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
          }],
        }],
      }),
    });

    let model = (await runScript(app, [{ key: 'm' }])).model;

    let frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    let footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('Escape Close modal');
    expect(footer).not.toContain('x Increment');

    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('Escape Close modal');
    expect(footer).not.toContain('F2/Esc close');

    model = (await runScript(app, [{ key: 'm' }, { key: KEY_ESCAPE }])).model;
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('F2/Esc close');
    expect(footer).not.toContain('Escape Close modal');
  });

  it('passes pane rects to overlayFactory for panel-scoped overlays', () => {
    let captured: FrameOverlayContext<PageModel> | undefined;

    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'split',
          splitId: 'shell',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
          paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
        }),
      }],
      overlayFactory(ctx) {
        captured = ctx;
        return [];
      },
    });

    const [model] = app.init();
    app.view(model);

    expect(captured).toBeDefined();
    expect(captured!.paneRects.has('left')).toBe(true);
    expect(captured!.paneRects.has('right')).toBe(true);
    // Body starts below the single-line header and above the footer
    expect(captured!.paneRects.get('left')!.row).toBeGreaterThanOrEqual(1);
  });

  it('renders mode and focused pane in the frame footer line', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      title: 'Status Test',
    });

    const [model] = app.init();
    const ctx = createTestContext();
    const frame = app.view(model);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const lines = surfaceToString(frame, ctx.style).split('\n');
    expect(lines[frame.height - 1]).toContain('[NORMAL]');
    expect(lines[frame.height - 1]).toContain('page:home');
    expect(lines[frame.height - 1]).toContain('pane:main');
  });

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

    expect(runtimeMsg).toBeDefined();

    const [nextModel, cmds] = app.update(runtimeMsg as Msg, model);
    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 200,
    });

    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(tickMsg).toBeDefined();

    const [visibleModel] = app.update(tickMsg as Msg, nextModel);
    const frame = app.view(visibleModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const rendered = surfaceToString(frame, testCtx.style);
    expect(rendered).toContain('Command rejected: worker crashed during boot');
    expect(cmds).toHaveLength(1);
  });

  it('lets pages push frame-managed notifications with notify()', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') {
          return [{
            ...model,
            count: model.count + 1,
          }, [notify<Msg>({
            title: 'Saved draft',
            tone: 'SUCCESS',
            message: 'Frame-managed notification from the page update',
          })]];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp({
      pages: [page],
      runtimeNotifications: {
        placement: 'TOP_CENTER',
        durationMs: 2_500,
      },
    });

    let [model] = app.init();
    let cmds: Cmd<FramedAppMsg<Msg>>[] = [];
    [model, cmds] = app.update({ type: 'inc' }, model);

    expect(model.pageModels.home?.count).toBe(1);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 123,
    });

    expect(returned).not.toBeUndefined();
    if (returned === undefined || returned === QUIT || isCmdCleanup(returned)) {
      throw new Error('expected a frame notification message');
    }

    [model, cmds] = app.update(returned as Msg, model);

    expect(model.runtimeNotifications.items).toHaveLength(1);
    expect(model.runtimeNotifications.items[0]).toMatchObject({
      title: 'Saved draft',
      tone: 'SUCCESS',
      message: 'Frame-managed notification from the page update',
      placement: 'TOP_CENTER',
      durationMs: 2_500,
    });
    expect(cmds).toHaveLength(1);

    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 200,
    });
    expect(tickMsg).not.toBeUndefined();
    if (tickMsg === undefined || tickMsg === QUIT || isCmdCleanup(tickMsg)) {
      throw new Error('expected a notification tick message');
    }

    const [visibleModel] = app.update(tickMsg as Msg, model);
    const frame = app.view(visibleModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    expect(surfaceToString(frame, testCtx.style)).toContain('notices:1');
  });
});
