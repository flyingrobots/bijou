import {
  afterAll,
  beforeAll,
  createFramedApp,
  createI18nRuntime,
  createTestContext,
  colorHex,
  ctrlKey,
  describe,
  describeFrameLayerStack,
  expect,
  FRAME_I18N_CATALOG,
  it,
  makeModalPage,
  makePage,
  normalizeViewOutput,
  pushNotification,
  QUIT,
  runScript,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  surfaceToString,
  _resetDefaultContextForTesting,
  Cmd,
  FramedAppMsg,
  Msg,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  const ignoreFrameMsg = (_msg: FramedAppMsg<Msg>): void => { void _msg; };
  const commandRuntime = { onPulse: (handler: (dt: number) => void) => ({ dispose: () => { void handler; } }) };

  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('localizes shell help groups and notification-center review copy', () => {
    const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    runtime.loadCatalog(FRAME_I18N_CATALOG);
    runtime.loadCatalog({
      namespace: 'bijou.shell',
      entries: [
        {
          key: { namespace: 'bijou.shell', id: 'key.group.frame' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Frame', fr: 'Cadre' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'key.toggleHelp' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Toggle help', fr: 'Basculer l’aide' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'help.group.general' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'General', fr: 'Général' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.filter.all' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'All', fr: 'Toutes' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.summary.liveArchived' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Live: {liveCount} • Archived: {archivedCount}',
            fr: 'Actives : {liveCount} • Archivées : {archivedCount}',
          },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.summary.filter' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Filter: {filter}',
            fr: 'Filtre : {filter}',
          },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.currentStack' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Current stack', fr: 'Pile actuelle' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.history.title' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'History • {filter} • {range}',
            fr: 'Historique • {filter} • {range}',
          },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.history.range.window' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: '{start}-{end} of {total}',
            fr: '{start}-{end} sur {total}',
          },
        },
        {
          key: { namespace: 'bijou.shell', id: 'notifications.history.action' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'Action: {label}',
            fr: 'Action : {label}',
          },
        },
      ],
    });

    let notifications = seedNotificationHistory<Msg>([
      {
        title: 'Deploy failed',
        message: 'The worker crashed.',
        variant: 'ACTIONABLE',
        tone: 'ERROR',
      },
    ]);
    notifications = pushNotification(notifications, {
      title: 'Live issue',
      message: 'Needs review.',
      variant: 'ACTIONABLE',
      tone: 'WARNING',
      durationMs: null,
      action: {
        label: 'Retry',
        payload: { type: 'noop' },
      },
    }, 999);

    const app = createFramedApp({
      i18n: runtime,
      pages: [makePage('home', 'Home', 'main')],
      notificationCenter: () => ({
        state: notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    let rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: 90, height: 24 }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Cadre');
    expect(rendered).toContain('Basculer l’aide');

    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update(shiftKey('n'), model);
    rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: 90, height: 24 }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Actives : 1');
    expect(rendered).toContain('Archivées');
    expect(rendered).toContain('Filtre : Toutes');
    expect(rendered).toContain('Pile actuelle');
    expect(rendered).toContain('Historique • Toutes • 1-1');
    expect(rendered).toContain('sur 1');
    expect(rendered).toContain('Action : Retry');
  });

  it('uses provided settings theme tokens for drawer chrome and selected rows', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        borderToken: { hex: '#335577' },
        bgToken: { hex: '#223344', bg: '#112233' },
        listTheme: {
          sectionTitleToken: { hex: '#ffaa00' },
          selectedRowBgToken: { hex: '#102938', bg: '#102938' },
          toggleOnToken: { hex: '#ff66cc' },
        },
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            checked: true,
            kind: 'toggle',
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 80,
      height: 24,
    }).surface;

    const hasBg = Array.from({ length: surface.height }, (_, y) =>
      Array.from({ length: surface.width }, (_, x) => colorHex(surface.get(x, y).bg)).includes('#102938'),
    ).some(Boolean);
    const hasAccent = Array.from({ length: surface.height }, (_, y) =>
      Array.from({ length: surface.width }, (_, x) => colorHex(surface.get(x, y).fg)).includes('#ff66cc'),
    ).some(Boolean);

    expect(colorHex(surface.get(0, 0).fg)).toBe('#335577');
    expect(hasBg).toBe(true);
    expect(hasAccent).toBe(true);
  });

  it('opens a quit-confirm modal from the shell and quits on confirmation', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    let cmds: Cmd<FramedAppMsg<Msg>>[];
    [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
    expect(model.quitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update({ type: 'key', key: 'y', ctrl: false, alt: false, shift: false }, model);
    expect(model.quitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]?.(ignoreFrameMsg, commandRuntime);
    expect(returned).toBe(QUIT);
  });

  it('accepts uppercase Y and N in the quit-confirm modal', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    let cmds: Cmd<FramedAppMsg<Msg>>[];

    [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
    expect(model.quitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update({ type: 'key', key: 'N', ctrl: false, alt: false, shift: true }, model);
    expect(model.quitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
    expect(model.quitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update({ type: 'key', key: 'Y', ctrl: false, alt: false, shift: true }, model);
    expect(model.quitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]?.(ignoreFrameMsg, commandRuntime);
    expect(returned).toBe(QUIT);
  });

  it('closes settings with escape without opening quit confirm', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
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

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(false);
    expect(model.quitConfirmOpen).toBe(false);
  });

  it('still opens quit confirm with q while settings are open', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
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

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(false);
    expect(model.quitConfirmOpen).toBe(true);
  });

  it('closes the command palette with escape without opening quit confirm', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey('p'), model);
    expect(model.commandPalette).toBeDefined();

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPalette).toBeUndefined();
    expect(model.quitConfirmOpen).toBe(false);
  });

  it('dismisses topmost layers before opening quit confirm', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
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

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(true);
    expect(model.helpOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(false);
    expect(model.settingsOpen).toBe(true);
    expect(model.quitConfirmOpen).toBe(false);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(false);
    expect(model.quitConfirmOpen).toBe(false);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.quitConfirmOpen).toBe(true);
  });

  it('describes the active frame layer stack for shell surfaces and page modals', async () => {
    const shellApp = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
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
      enableCommandPalette: true,
    });

    let [shellModel] = shellApp.init();
    expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace']);

    [shellModel] = shellApp.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, shellModel);
    expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings']);

    [shellModel] = shellApp.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, shellModel);
    expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);

    [shellModel] = shellApp.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, shellModel);
    [shellModel] = shellApp.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, shellModel);
    expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'search']);

    [shellModel] = shellApp.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, shellModel);
    [shellModel] = shellApp.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, shellModel);
    expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'quit-confirm']);

    const modalApp = createFramedApp({
      pages: [makeModalPage('home', 'Home', 'main')],
    });

    const modalResult = await runScript(modalApp, [{ key: 'm' }]);
    const modalModel = modalResult.model;
    expect(describeFrameLayerStack(modalModel, { pageModalOpen: !!modalModel.pageModels.home?.modalOpen }).map((layer) => layer.kind)).toEqual([
      'workspace',
      'page-modal',
    ]);
  });
});
