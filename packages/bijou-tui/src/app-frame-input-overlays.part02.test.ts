
import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createSurface,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  getDefaultContext,
  it,
  normalizeViewOutput,
  setDefaultContext,
  surfaceHasBg,
  surfaceHasFg,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('keeps ambient default-context apps in sync when shellThemes change without explicit ctx wiring', () => {
    const defaultCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 80, rows: 24 },
    });
    const alternateTheme = createAlternateShellTheme(defaultCtx);

    _resetDefaultContextForTesting();
    try {
      setDefaultContext(defaultCtx);
      const app = createFramedApp({
        pages: [{
          id: 'home',
          title: 'Home',
          init: () => [{ count: 0 }, []],
          update: (msg, model) => [model, []],
          layout: () => ({
            kind: 'pane',
            paneId: 'main',
            render: () => {
              const ctx = getDefaultContext();
              const surface = createSurface(8, 1);
              surface.fill({
                char: ' ',
                bg: ctx.surface('primary').bg,
                bgRGB: ctx.surface('primary').bgRGB,
                empty: false,
              });
              surface.set(0, 0, {
                char: 'A',
                fg: ctx.semantic('muted').hex,
                fgRGB: ctx.semantic('muted').fgRGB,
                bg: ctx.surface('primary').bg,
                bgRGB: ctx.surface('primary').bgRGB,
                empty: false,
              });
              return surface;
            },
          }),
        }],
        shellThemes: [
          { id: 'default', label: 'Default', theme: defaultCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
      });

      let [model] = app.init();
      expect(model.activeShellThemeId).toBe('default');
      expect(getDefaultContext().theme.theme).toBe(defaultCtx.theme.theme);

      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);

      expect(model.activeShellThemeId).toBe('alternate');
      expect(getDefaultContext().theme.theme).toBe(alternateTheme);

      const surface = normalizeViewOutput(app.view(model), {
        width: defaultCtx.runtime.columns,
        height: defaultCtx.runtime.rows,
      }).surface;
      expect(surfaceHasFg(surface, '#7dd3fc')).toBe(true);
      expect(surfaceHasBg(surface, getDefaultContext().surface('primary').bg ?? '')).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
