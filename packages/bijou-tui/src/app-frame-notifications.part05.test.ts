
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
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('toggles the active shell theme family mode with ctrl+t', () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const alternateTheme = createAlternateShellTheme(explicitCtx);
    const emitted: {
      readonly id: string;
      readonly shellThemeId: string | undefined;
      readonly modeId: string | undefined;
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
          { id: 'single', label: 'Single', theme: explicitCtx.theme.theme },
        ],
        onShellThemeChange(change) {
          emitted.push({
            id: change.shellTheme.id,
            shellThemeId: change.shellThemeId,
            modeId: change.modeId,
          });
        },
      });

      let [model] = app.init();
      expect(model.activeShellThemeId).toBe('dogfood:dark');

      [model] = app.update(ctrlKey('t'), model);
      expect(model.activeShellThemeId).toBe('dogfood:light');
      expect(model.settingsOpen).toBe(false);
      expect(emitted).toEqual([
        { id: 'dogfood:dark', shellThemeId: 'dogfood', modeId: 'dark' },
        { id: 'dogfood:light', shellThemeId: 'dogfood', modeId: 'light' },
      ]);
      expect(model.runtimeNotifications.items[0]?.message).toBe('Shell theme set to DOGFOOD / Light.');

      [model] = app.update(ctrlKey('t'), model);
      expect(model.activeShellThemeId).toBe('dogfood:dark');
      expect(emitted.at(-1)).toEqual({
        id: 'dogfood:dark',
        shellThemeId: 'dogfood',
        modeId: 'dark',
      });
      expect(model.activeShellThemeId).not.toBe('single');
    } finally {
      setDefaultContext(testCtx);
    }
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('explains ctrl+t on a single-mode shell theme instead of silently doing nothing', () => {
    const explicitCtx = createTestContext({ mode: 'interactive' });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

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
          { id: 'single', label: 'Single', theme: explicitCtx.theme.theme },
        ],
      });

      let [model] = app.init();
      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

      expect(model.activeShellThemeId).toBe('single');

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update(ctrlKey('t'), model);

      expect(model.activeShellThemeId).toBe('single');
      expect(model.runtimeNotifications.items.map((item) => item.message)).toContain(
        'Shell theme Single has no alternate mode.',
      );
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
