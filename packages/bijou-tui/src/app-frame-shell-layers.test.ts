import {
  afterAll,
  beforeAll,
  createFramedApp,
  createI18nRuntime,
  createKeyMap,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  FRAME_I18N_CATALOG,
  it,
  KEY_BACKTICK,
  KEY_CTRL_P,
  KEY_ENTER,
  KEY_ESCAPE,
  makePage,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  MouseMsg,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => setDefaultContext(testCtx));
  afterAll(() => _resetDefaultContextForTesting());

  it('switches tabs when the user clicks a header tab', async () => {
    const app = createFramedApp({
      title: 'Test',
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });

    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'left',
        action: 'press',
        col: 15,
        row: 0,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);

    expect(result.model.activePageId).toBe('logs');
  });

  it('toggles help with ?', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }]);
    expect(result.model.helpOpen).toBe(true);
  });

  it('closes help with ? when help is open', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }, { key: '?' }]);
    expect(result.model.helpOpen).toBe(false);
  });

  it('closes help with escape without opening quit confirm', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }, { key: KEY_ESCAPE }]);
    expect(result.model.helpOpen).toBe(false);
    expect((result.model as any).quitConfirmOpen).toBe(false);
  });

  it('toggles the perf HUD from the workspace and active help layer', async () => {
    const app = createFramedApp({
      initialColumns: 96,
      initialRows: 30,
      pages: [makePage('home', 'Home', 'main')],
    });

    const workspaceResult = await runScript(app, [{ key: KEY_BACKTICK }]);
    expect(workspaceResult.model.perfHudOpen).toBe(true);
    expect(surfaceToString(workspaceResult.frames.at(-1)!, testCtx.style)).toContain('Perf HUD');

    const helpResult = await runScript(app, [{ key: '?' }, { key: KEY_BACKTICK }]);
    expect(helpResult.model.helpOpen).toBe(true);
    expect(helpResult.model.perfHudOpen).toBe(true);
    expect(surfaceToString(helpResult.frames.at(-1)!, testCtx.style)).toContain('Perf HUD');
  });

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
            next = next.bind(`${index % 10}`, `Binding ${index}`, { type: 'noop' });
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

    expect((model as any).helpOpen).toBe(true);
    expect((model as any).helpScrollY).toBeGreaterThan(0);
  });

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

  it('blocks page mouse updates while help or the command palette is open', async () => {
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
        render: () => textView('main'),
      }),
      commandItems: () => [{
        id: 'noop',
        label: 'No-op',
        action: { type: 'inc' },
      }],
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({
      pages: [page],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      {
        key: '?',
      },
      {
        mouse: {
          type: 'mouse',
          button: 'none',
          action: 'scroll-down',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
      {
        key: '?',
      },
      {
        key: KEY_CTRL_P,
      },
      {
        mouse: {
          type: 'mouse',
          button: 'right',
          action: 'press',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
    ]);

    expect(result.model.helpOpen).toBe(false);
    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.pageModels.home?.count).toBe(0);
  });

  it('opens settings with F2 and lets / and ctrl+p switch between search and the command palette', () => {
    const app = createFramedApp({
      pages: [{
        ...makePage('home', 'Home', 'main'),
        searchTitle: 'Search home',
        searchItems: () => [{
          id: 'home-search',
          label: 'Home result',
        }],
      }],
      enableCommandPalette: true,
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
    expect((model as any).settingsOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).settingsOpen).toBe(false);

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Search home');

    [model] = app.update(ctrlKey('p'), model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Command Palette');

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Search home');

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeUndefined();
  });

  it('opens page search with search metadata derived from the active page model', () => {
    const page: FramePage<PageModel, Msg> = {
      ...makePage('home', 'Home', 'main'),
      searchTitle: (model) => `Search count ${model.count}`,
      searchItems: (model) => [{
        id: 'count-result',
        label: `Count ${model.count}`,
      }],
    };
    const app = createFramedApp({
      pages: [page],
      enableCommandPalette: true,
    });

    let [model] = app.init();
    [model] = app.update({ type: 'inc' }, model);
    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);

    expect(model.pageModels.home?.count).toBe(1);
    expect((model as any).commandPaletteKind).toBe('search');
    expect((model as any).commandPaletteTitle).toBe('Search count 1');
    expect((model as any).commandPalette?.items).toEqual([{
      id: 'search:0',
      label: 'Count 1',
      category: 'Home',
    }]);
  });

  it('lets search results dispatch to another page and activate that page', async () => {
    const app = createFramedApp({
      pages: [
        {
          ...makePage('home', 'Home', 'main'),
          searchItems: () => [{
            id: 'docs-result',
            label: 'Docs result',
            action: { type: 'inc' },
            targetPageId: 'docs',
          }],
        },
        makePage('docs', 'Docs', 'docs-main'),
      ],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: '/' },
      { key: KEY_ENTER },
    ]);

    expect(result.model.activePageId).toBe('docs');
    expect(result.model.pageModels.docs?.count).toBe(1);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('ignores search result page targets that are no longer available', async () => {
    const app = createFramedApp({
      pages: [
        {
          ...makePage('home', 'Home', 'main'),
          searchItems: () => [{
            id: 'missing-result',
            label: 'Missing result',
            action: { type: 'inc' },
            targetPageId: 'missing',
          }],
        },
      ],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: '/' },
      { key: KEY_ENTER },
    ]);

    expect(result.model.activePageId).toBe('home');
    expect(result.model.pageModels.home?.count).toBe(0);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('uses localized shell defaults for command palette and settings footer copy', () => {
    const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    runtime.loadCatalog(FRAME_I18N_CATALOG);
    runtime.loadCatalog({
      namespace: 'bijou.shell',
      entries: [
        {
          key: { namespace: 'bijou.shell', id: 'palette.title' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Command Palette', fr: 'Palette de commandes' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'settings.title' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Settings', fr: 'Paramètres' },
        },
        {
          key: { namespace: 'bijou.shell', id: 'settings.footer' },
          kind: 'message',
          sourceLocale: 'en',
          values: {
            en: 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit',
            fr: 'F2/Échap fermer • ↑/↓ lignes • Entrée basculer • / chercher • q quitter',
          },
        },
      ],
    });

    const app = createFramedApp({
      i18n: runtime,
      enableCommandPalette: true,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
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
    [model] = app.update(ctrlKey('p'), model);
    let surface = normalizeViewOutput(app.view(model), {
      width: 80,
      height: 24,
    }).surface;
    expect(surfaceToString(surface, testCtx.style)).toContain('Palette de commandes');

    [model] = app.update(ctrlKey('p'), model);
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    surface = normalizeViewOutput(app.view(model), {
      width: 80,
      height: 24,
    }).surface;
    const rendered = surfaceToString(surface, testCtx.style);
    const footer = rendered.split('\n').at(-1) ?? '';

    expect(rendered).toContain('Paramètres');
    expect(footer).toContain('Échap fermer');
    expect(footer).toContain('Entrée basculer');
  });
});
