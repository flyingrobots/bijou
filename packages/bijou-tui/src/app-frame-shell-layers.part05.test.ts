
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createI18nRuntime,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  FRAME_I18N_CATALOG,
  it,
  KEY_ENTER,
  makePage,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

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
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

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
