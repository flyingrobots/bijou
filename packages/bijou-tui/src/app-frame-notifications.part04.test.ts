import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  _resetDefaultContextForTesting,
  BijouContext,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('supports mode-aware shellThemes and emits family plus mode facts', () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const originalTheme = explicitCtx.theme;
    const originalTokenGraph = explicitCtx.tokenGraph;
    const alternateTheme = createAlternateShellTheme(explicitCtx);
    const emitted: {
      readonly shellThemeId: string | undefined;
      readonly modeId: string | undefined;
      readonly id: string;
      readonly shellThemeSpecId: string;
      readonly themeName: string;
      readonly ctx: BijouContext;
    }[] = [];

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [
          {
            id: 'dogfood',
            label: 'DOGFOOD',
            modes: [
              { id: 'dark', label: 'Dark', theme: explicitCtx.theme.theme },
              { id: 'light', label: 'Light', theme: alternateTheme },
            ],
          },
        ],
        onShellThemeChange(change) {
          emitted.push({
            shellThemeId: change.shellThemeId,
            modeId: change.modeId,
            id: change.shellTheme.id,
            shellThemeSpecId: change.shellThemeSpec.id,
            themeName: change.shellTheme.theme.name,
            ctx: change.ctx,
          });
        },
      });

      let [model] = app.init();
      expect(model.activeShellThemeId).toBe('dogfood:dark');
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toMatchObject({
        id: 'dogfood:dark',
        shellThemeSpecId: 'dogfood',
        shellThemeId: 'dogfood',
        modeId: 'dark',
        themeName: explicitCtx.theme.theme.name,
      });
      expect(emitted[0]?.ctx).not.toBe(explicitCtx);
      expect(explicitCtx.theme).toBe(originalTheme);
      expect(explicitCtx.tokenGraph).toBe(originalTokenGraph);

      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

      expect(model.activeShellThemeId).toBe('dogfood:light');
      expect(emitted).toHaveLength(2);
      expect(emitted[1]).toMatchObject({
        id: 'dogfood:light',
        shellThemeSpecId: 'dogfood',
        shellThemeId: 'dogfood',
        modeId: 'light',
        themeName: 'alternate-shell',
      });
      expect(emitted[1]?.ctx).not.toBe(explicitCtx);
      expect(emitted[1]?.ctx.theme).not.toBe(originalTheme);
      expect(emitted[1]?.ctx.tokenGraph).not.toBe(originalTokenGraph);
      expect(explicitCtx.theme).toBe(originalTheme);
      expect(explicitCtx.tokenGraph).toBe(originalTokenGraph);
      expect(explicitCtx.theme.theme.name).not.toBe('alternate-shell');
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
