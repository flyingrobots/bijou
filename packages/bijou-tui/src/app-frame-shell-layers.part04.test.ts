import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  KEY_ENTER,
  makePage,
  runScript,
  setDefaultContext,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

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
    expect(model.settingsOpen).toBe(true);
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsOpen).toBe(false);
    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPalette).toBeDefined();
    expect(model.commandPaletteKind).toBe('search');
    [model] = app.update(ctrlKey('p'), model);
    expect(model.commandPalette).toBeDefined();
    expect(model.commandPaletteKind).toBe('command');
    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPalette).toBeDefined();
    expect(model.commandPaletteKind).toBe('search');
    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPalette).toBeUndefined();
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('opens page search with search metadata derived from the active page model', () => {
    const page: FramePage<PageModel, Msg> = {
      ...makePage('home', 'Home', 'main'),
      searchTitle: (model) => `Search count ${String(model.count)}`,
      searchItems: (model) => [{
        id: 'count-result',
        label: `Count ${String(model.count)}`,
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
    expect(model.commandPaletteKind).toBe('search');
    expect(model.commandPalette?.items).toEqual([{
      id: 'search:0',
      label: 'Count 1',
      category: 'Home',
    }]);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

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
});
