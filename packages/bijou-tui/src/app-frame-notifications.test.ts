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
  KEY_CTRL_P,
  KEY_ENTER,
  makePage,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceToString,
  textView,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
  BijouContext,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('dispatches selected custom commandItems actions', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update(msg, model) {
          if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
          return [model, []];
        },
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => textView('main'),
        }),
        commandItems: () => [{
          id: 'boost',
          label: 'Mega Boost',
          action: { type: 'inc' },
        }],
      }],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'm' },
      { key: 'e' },
      { key: 'g' },
      { key: 'a' },
      { key: KEY_ENTER },
    ]);

    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('opens settings with the standard shell binding and blocks page keys while open', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    expect(model.settingsOpen).toBe(true);

    const [nextModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    expect(nextModel.pageModels.home?.count).toBe(0);
    expect(nextModel.settingsOpen).toBe(true);
    expect(cmds).toHaveLength(0);
  });

  it('routes key ownership through the runtime view stack before page bindings', () => {
    const observed: string[] = [];
    const app = createFramedApp<PageModel, Msg>({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
          }],
        }],
      }),
      enableCommandPalette: true,
      observeKey(msg, route) {
        observed.push(`${route}:${msg.ctrl ? 'ctrl+' : ''}${msg.key}`);
        return undefined;
      },
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    expect(model.settingsOpen).toBe(true);

    const [pageKeyModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    model = pageKeyModel;
    expect(model.pageModels.home?.count).toBe(0);
    expect(cmds).toHaveLength(0);

    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(true);

    [model] = app.update(ctrlKey('p'), model);
    expect(model.commandPalette).toBeUndefined();

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(false);

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPaletteKind).toBe('search');

    app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);

    expect(observed).toEqual([
      'frame:ctrl+,',
      'frame:x',
      'frame:?',
      'help:ctrl+p',
      'help:escape',
      'frame:/',
      'palette:x',
    ]);
  });

  it('shows a shell-owned toast when a settings row is activated', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: 'Settings',
              message: 'Show hints turned off.',
            },
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const [nextModel, cmds] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

    expect(cmds).toHaveLength(2);
    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(nextModel.runtimeNotifications.items[0]?.title).toBe('Settings');
    expect(nextModel.runtimeNotifications.items[0]?.message).toBe('Show hints turned off.');

    const rendered = surfaceToString(normalizeViewOutput(app.view(nextModel), {
      width: testCtx.runtime.columns,
      height: testCtx.runtime.rows,
    }).surface, testCtx.style);
    expect(rendered).toContain('notices:1');
  });

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
