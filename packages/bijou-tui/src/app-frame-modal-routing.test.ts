import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createKeyMap,
  createNotificationState,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makeLongContent,
  makePage,
  normalizeViewOutput,
  pushNotification,
  runScript,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  surfaceHasBg,
  surfaceHasFg,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  FramedAppMsg,
  Msg,
  NotificationHistoryFilter,
  NotificationState,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => setDefaultContext(testCtx));
  afterAll(() => _resetDefaultContextForTesting());

  it('toggles shell theme mode from the standard command palette entry', async () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        enableCommandPalette: true,
        shellThemes: [{
          id: 'dogfood',
          label: 'DOGFOOD',
          modes: [
            { id: 'dark', label: 'Dark', theme: explicitCtx.theme.theme },
            { id: 'light', label: 'Light', theme: alternateTheme },
          ],
        }],
      });

      const result = await runScript(app, [
        { key: KEY_CTRL_P },
        { key: 't' },
        { key: 'h' },
        { key: 'e' },
        { key: 'm' },
        { key: 'e' },
        { key: KEY_ENTER },
      ], { ctx: explicitCtx });

      expect(result.model.activeShellThemeId).toBe('dogfood:light');
      expect(result.model.commandPalette).toBeUndefined();
    } finally {
      setDefaultContext(testCtx);
    }
  });

  it('opens the shell notification center with Shift+N and closes it with the same binding', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    expect((model as any).notificationCenterOpen).toBe(true);

    [model] = app.update(shiftKey('n'), model);
    expect((model as any).notificationCenterOpen).toBe(false);
  });

  it('closes the shell notification center with escape without opening quit confirm', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    expect((model as any).notificationCenterOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).notificationCenterOpen).toBe(false);
    expect((model as any).quitConfirmOpen).toBe(false);
  });

  it('scrolls a shell notification center independently of the underlying page', () => {
    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<Msg>;
    }

    const notifications = seedNotificationHistory<Msg>(
      Array.from({ length: 18 }, (_, index) => ({
        title: `Notice ${index}`,
        tone: index % 2 === 0 ? 'WARNING' : 'INFO',
      })),
    );

    const page: FramePage<NotificationPageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications,
      }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('home:main')),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp<NotificationPageModel, Msg>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as Msg, model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false } as unknown as Msg, model);

    expect((model as any).notificationCenterOpen).toBe(true);
    expect((model as any).notificationCenterScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);

    const [nextModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false } as unknown as Msg, model);
    expect(nextModel.pageModels.home?.count).toBe(0);
    expect((nextModel as any).notificationCenterOpen).toBe(true);
    expect(cmds).toHaveLength(0);
  });

  it('cycles notification-center filters through app-provided filter state', async () => {
    const filters: readonly NotificationHistoryFilter[] = ['ALL', 'ERROR', 'WARNING'];

    type NotificationMsg =
      | { type: 'inc' }
      | { type: 'set-history-filter'; filter: NotificationHistoryFilter };

    interface NotificationPageModel {
      readonly count: number;
      readonly notifications: NotificationState<NotificationMsg>;
      readonly filterIndex: number;
    }

    const page: FramePage<NotificationPageModel, NotificationMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<NotificationMsg>([
          { title: 'Deploy blocked', tone: 'ERROR' },
          { title: 'Queue pressure', tone: 'WARNING' },
        ]),
        filterIndex: 0,
      }, []],
      update(msg, model) {
        if (msg.type === 'set-history-filter') {
          return [{
            ...model,
            filterIndex: Math.max(0, filters.indexOf(msg.filter)),
          }, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<NotificationPageModel, NotificationMsg>({
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
        filters,
        activeFilter: filters[pageModel.filterIndex]!,
        onFilterChange: (filter) => ({ type: 'set-history-filter', filter }),
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as NotificationMsg, model);
    let cmds: Cmd<FramedAppMsg<NotificationMsg>>[] = [];
    [model, cmds] = app.update({ type: 'key', key: 'f', ctrl: false, alt: false, shift: false } as unknown as NotificationMsg, model);

    expect(cmds).toHaveLength(1);
    const returned = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
    });
    [model] = app.update(returned as NotificationMsg, model);

    expect(model.pageModels.home?.filterIndex).toBe(1);
    expect((model as any).notificationCenterScrollY).toBe(0);
  });

  it('opens the shell notification center from the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 'n' },
      { key: 'o' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);

    expect((result.model as any).notificationCenterOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('renders the shell notification center with calmer section spacing and inset notice rows', () => {
    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<Msg>;
    }

    const archived = seedNotificationHistory<Msg>([
      { title: 'Archived info', tone: 'INFO' },
      { title: 'Archived warning', tone: 'WARNING' },
    ]);
    const live = pushNotification(archived, {
      title: 'Deploy failed',
      message: 'The worker crashed before boot.',
      tone: 'ERROR',
      durationMs: null,
    }, 999);

    const page: FramePage<NotificationPageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: archived,
      }, []],
      update(_msg, model) {
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<NotificationPageModel, Msg>({
      initialColumns: 90,
      initialRows: 18,
      pages: [page],
      notificationCenter: () => ({
        state: live,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as Msg, model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 90,
      height: 18,
    }).surface;
    const lines = surfaceToString(surface, testCtx.style).split('\n');
    const liveLine = lines.findIndex((line) => line.includes('Live: 1 • Archived: 2'));
    const stackLine = lines.findIndex((line) => line.includes('Current stack'));
    const noticeLine = lines.findIndex((line) => line.includes('Deploy failed'));
    const historyLine = lines.findIndex((line) => line.includes('History • All'));

    expect(liveLine).toBeGreaterThanOrEqual(0);
    expect(stackLine).toBeGreaterThan(liveLine + 1);
    expect(noticeLine).toBeGreaterThan(stackLine + 1);
    expect(lines[noticeLine]!.indexOf('Deploy failed')).toBeGreaterThan(0);
    expect(historyLine).toBeGreaterThan(noticeLine + 2);
  });

  it('uses the active shell theme for the notification center drawer with an explicit ctx', () => {
    const explicitCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 90, rows: 18 },
    });
    const alternateTheme = createAlternateShellTheme(explicitCtx);
    const live = pushNotification(createNotificationState<Msg>(), {
      title: 'Deploy failed',
      message: 'The worker crashed before boot.',
      tone: 'ERROR',
      durationMs: null,
    }, 999);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        initialColumns: 90,
        initialRows: 18,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
        notificationCenter: () => ({
          state: live,
        }),
      });

      let [model] = app.init();
      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update(shiftKey('n') as unknown as Msg, model);

      const surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      const rendered = surfaceToString(surface, explicitCtx.style);

      expect(rendered).toContain('Notifications');
      expect(rendered).toContain('Deploy failed');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);
      expect(surfaceHasFg(surface, '#ff66cc')).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });

  it('surfaces a footer notification cue when archived shell notifications exist', async () => {
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

    const [nextModel, cmds] = app.update(runtimeMsg as Msg, model);
    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 8_000,
    });
    const [archivedModel] = app.update(tickMsg as Msg, nextModel);
    const frame = app.view(archivedModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const footer = surfaceToString(frame, testCtx.style).split('\n').at(-1)!;

    expect(footer).toContain('notices:1');
  });
});
