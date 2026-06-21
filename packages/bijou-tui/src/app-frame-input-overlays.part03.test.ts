
import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createSameNameAlternateShellTheme,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makePage,
  normalizeViewOutput,
  setDefaultContext,
  surfaceHasBg,
  surfaceHasFg,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('uses the active shell theme for shell-owned modals and palette content with an explicit ctx', () => {
    const explicitCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 80, rows: 24 },
    });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        enableCommandPalette: true,
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
      });

      let [model] = app.init();
      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      expect(model.activeShellThemeId).toBe('alternate');

      [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
      let surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      expect(surfaceToString(surface, explicitCtx.style)).toContain('Keyboard Help');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update(ctrlKey('p'), model);
      surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      expect(surfaceToString(surface, explicitCtx.style)).toContain('Command Palette');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);
      expect(surfaceHasFg(surface, '#7dd3fc')).toBe(true);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      expect(surfaceToString(surface, explicitCtx.style)).toContain('Quit?');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);
      expect(surfaceHasFg(surface, '#ff66cc')).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('applies shellThemes by option id even when multiple themes share the same Theme.name', () => {
    const explicitCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 80, rows: 24 },
    });
    const alternateTheme = createSameNameAlternateShellTheme(explicitCtx);
    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'same-name-alternate', label: 'Same Name Alternate', theme: alternateTheme },
        ],
      });
      let [model] = app.init();
      expect(model.activeShellThemeId).toBe('default');
      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      const surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      expect(model.activeShellThemeId).toBe('same-name-alternate');
      expect(surfaceToString(surface, explicitCtx.style)).toContain('Quit?');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);
      expect(surfaceHasFg(surface, '#ff66cc')).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
