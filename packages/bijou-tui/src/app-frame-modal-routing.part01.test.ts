import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makePage,
  runScript,
  setDefaultContext,
  shiftKey,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

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
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('opens the shell notification center with Shift+N and closes it with the same binding', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    expect(model.notificationCenterOpen).toBe(true);

    [model] = app.update(shiftKey('n'), model);
    expect(model.notificationCenterOpen).toBe(false);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('closes the shell notification center with escape without opening quit confirm', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    expect(model.notificationCenterOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.notificationCenterOpen).toBe(false);
    expect(model.quitConfirmOpen).toBe(false);
  });
});
