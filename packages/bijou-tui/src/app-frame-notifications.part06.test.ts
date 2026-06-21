import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('toggles shell theme mode through the frame action wrapper', () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [{
          id: 'dogfood',
          label: 'DOGFOOD',
          modes: [
            { id: 'dark', label: 'Dark', theme: explicitCtx.theme.theme },
            { id: 'light', label: 'Light', theme: alternateTheme },
          ],
        }],
      });

      let [model] = app.init();
      [model] = app.update(wrapFrameMsg({ type: 'toggle-shell-theme-mode' }), model);

      expect(model.activeShellThemeId).toBe('dogfood:light');
      expect(model.runtimeNotifications.items[0]?.message).toBe('Shell theme set to DOGFOOD / Light.');
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
