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

  it('supports shellThemes with an explicit ctx and emits fresh contexts without mutating the caller context', () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const originalTheme = explicitCtx.theme;
    const originalTokenGraph = explicitCtx.tokenGraph;
    const alternateTheme = createAlternateShellTheme(explicitCtx);
    const emitted: { readonly id: string; readonly ctx: BijouContext }[] = [];

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
        onShellThemeChange(change) {
          emitted.push({ id: change.shellTheme.id, ctx: change.ctx });
        },
      });

      let [model] = app.init();
      expect(model.activeShellThemeId).toBe('default');
      expect(emitted).toHaveLength(1);
      expect(emitted[0]?.id).toBe('default');
      expect(emitted[0]?.ctx).not.toBe(explicitCtx);

      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

      expect(model.activeShellThemeId).toBe('alternate');
      expect(emitted).toHaveLength(2);
      expect(emitted[1]?.id).toBe('alternate');
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
