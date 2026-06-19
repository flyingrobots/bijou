import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createSameNameAlternateShellTheme,
  createSplitPaneState,
  createSurface,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  getDefaultContext,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makeLongContent,
  makePage,
  mockClock,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceHasBg,
  surfaceHasFg,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('uses the run-time ctx as the shell rendering context when shellThemes are configured without an ambient default', async () => {
    const clock = mockClock();
    const explicitCtx = createTestContext({
      mode: 'interactive',
      clock,
      runtime: { columns: 80, rows: 24 },
    });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

    _resetDefaultContextForTesting();
    try {
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
              const ctx = explicitCtx;
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
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
      });

      explicitCtx.io.rawInput = (onKey) => {
        const handles = [
          clock.setTimeout(() => { onKey('\x03'); }, 20),
          clock.setTimeout(() => { onKey('\x03'); }, 30),
        ];
        return {
          dispose() {
            handles.forEach((handle) => {
              handle.dispose();
            });
          },
        };
      };

      const promise = app.run({ ctx: explicitCtx });
      await clock.advanceByAsync(80);
      await promise;

      expect(explicitCtx.io.written.some((chunk) => chunk.includes('Home'))).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });

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
  it('scrolls a long settings drawer independently of the underlying page', () => {
    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 14,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: Array.from({ length: 24 }, (_, index) => ({
            id: `setting-${index}`,
            label: `Setting ${index}`,
            valueLabel: index % 2 === 0 ? 'On' : 'Off',
          })),
        }],
      }),
    });
    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).settingsScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);
  });
  it('renders settings row descriptions as secondary drawer copy', () => {
    const app = createFramedApp({
      initialColumns: 90,
      initialRows: 18,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            description: 'Show active control cues in the footer.',
            checked: true,
            valueLabel: 'On',
            kind: 'toggle',
          }],
        }],
      }),
    });
    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 90,
      height: 18,
    }).surface;
    const rendered = surfaceToString(surface, testCtx.style);
    const lines = rendered.split('\n');
    const shellLine = lines.findIndex((line) => line.includes('Shell'));
    const rowLine = lines.findIndex((line) => line.includes('Show hints'));
    const rowX = rowLine >= 0 ? lines[rowLine]?.indexOf('Show hints') : -1;
    expect(rendered).toContain('Show hints');
    expect(rendered).toContain('☑ On');
    expect(rendered).toContain('Show active control');
    expect(rendered).toContain('cues in the footer');
    expect(rowLine).toBeGreaterThan(shellLine + 1);
    expect(rowX).toBeGreaterThan(0);
    expect(surface.get(rowX, rowLine).bg).toBe(testCtx.surface('elevated').bg);
  });
  it('fills the entire frame body with the primary surface background', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 'body-split',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left', 12)) },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right', 12)) },
      }),
    };
    const app = createFramedApp({
      initialColumns: 24,
      initialRows: 6,
      pages: [page],
    });
    const [model] = app.init();
    const surface = normalizeViewOutput(app.view(model), {
      width: 24,
      height: 6,
    }).surface;
    const expectedBg = testCtx.surface('primary').bg;
    expect(expectedBg).toBeDefined();
    for (let y = 1; y < surface.height - 1; y++) {
      for (let x = 0; x < surface.width; x++) {
        expect(surface.get(x, y).bg).toBe(expectedBg);
      }
    }
  });
  it('stacks long settings values beneath the label when inline space is too tight', () => {
    const app = createFramedApp({
      initialColumns: 72,
      initialRows: 18,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'appearance',
          title: 'Appearance',
          rows: [{
            id: 'theme',
            label: 'Landing theme',
            valueLabel: 'Storybook Workstation',
            kind: 'choice',
          }],
        }],
      }),
    });
    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 72,
      height: 18,
    }).surface;
    const lines = surfaceToString(surface, testCtx.style).split('\n');
    const labelLine = lines.findIndex((line) => line.includes('Landing theme'));
    const valueLine = lines.findIndex((line) => line.includes('Storybook Workstation'));
    expect(labelLine).toBeGreaterThanOrEqual(0);
    expect(valueLine).toBe(labelLine + 1);
  });
  it('opens settings from the standard command palette entry', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
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
    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 's' },
      { key: 'e' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);
    expect((result.model as any).settingsOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });
});
