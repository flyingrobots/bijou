import {
  activeDocsPageModel,
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_DOWN,
  KEY_ENTER,
  KEY_NEXT_TAB,
  keyMsg,
  normalizeViewOutput,
  readFileSync,
  runScript,
  TOKEN_DOCTRINE_PATH,
  _resetDefaultContextForTesting,
  Theme,
} from './docs-preview.test-support.js';

describe('docs preview app', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('documents every built-in token with usage guidance and dark/light UX posture', () => {
    const doctrine = readFileSync(TOKEN_DOCTRINE_PATH, 'utf8');
    const requiredRows = [
      'semantic.primary',
      'semantic.muted',
      'semantic.accent',
      'semantic.success',
      'semantic.error',
      'semantic.warning',
      'semantic.info',
      'surface.primary',
      'surface.secondary',
      'surface.elevated',
      'surface.overlay',
      'surface.muted',
      'border.primary',
      'border.secondary',
      'border.success',
      'border.warning',
      'border.error',
      'border.muted',
      'ui.cursor',
      'ui.focusGutter',
      'ui.scrollThumb',
      'ui.scrollTrack',
      'ui.sectionHeader',
      'ui.logo',
      'ui.tableHeader',
      'ui.trackEmpty',
      'status.success',
      'status.error',
      'status.warning',
      'status.info',
      'status.pending',
      'status.active',
      'status.muted',
      'gradient.brand',
      'gradient.progress',
    ];

    expect(doctrine).toContain('## Per-Token Library Reference');
    expect(doctrine).toContain('## Default Dark/Light UX Audit');
    expect(doctrine).toContain('## Theme Debugger And Lab');
    expect(doctrine).toContain('Use when');
    expect(doctrine).toContain('Do not use when');
    for (const token of requiredRows) {
      expect(doctrine).toContain(`| \`${token}\` |`);
    }
  });

  it('carries the selected landing theme into docs through the shared shell theme setting', async () => {
    const defaultCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const defaultApp = createDocsApp(defaultCtx);
    const themedCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const themedApp = createDocsApp(themedCtx);

    const defaultDocs = await runScript(defaultApp, [{ key: KEY_ENTER }], { ctx: defaultCtx });
    const [defaultSettingsModel] = defaultApp.update(keyMsg('f2'), defaultDocs.model);
    const defaultSettingsFrame = normalizeViewOutput(defaultApp.view(defaultSettingsModel), {
      width: defaultCtx.runtime.columns,
      height: defaultCtx.runtime.rows,
    }).surface;
    const themedDocs = await runScript(themedApp, [
      { key: '2' },
      { key: KEY_ENTER },
    ], { ctx: themedCtx });

    const themedModel = themedDocs.model;
    const themedDocsSurface = normalizeViewOutput(themedApp.view(themedModel), {
      width: themedCtx.runtime.columns,
      height: themedCtx.runtime.rows,
    }).surface;
    const themedDocsText = frameText(themedDocsSurface);
    const [settingsModel] = themedApp.update(keyMsg('f2'), themedModel);
    const settingsFrame = normalizeViewOutput(themedApp.view(settingsModel), {
      width: themedCtx.runtime.columns,
      height: themedCtx.runtime.rows,
    }).surface;

    expect(activeDocsPageModel(themedModel).landingThemeIndex).toBe(1);
    expect(themedModel.docsModel.activeShellThemeId).toBe('cabinet-of-curiosities');
    expect(themedDocsText).not.toContain('Theme:');
    expect(frameText(settingsFrame)).toContain('Shell theme');
    expect(frameText(settingsFrame)).toContain('Cabinet of Curiosities');
    expect(frameText(settingsFrame)).not.toContain('Landing theme');
    expect(defaultSettingsFrame.get(20, 3).bg).not.toBe(settingsFrame.get(20, 3).bg);
  });

  it('shows a toast with the theme name when the landing theme changes and clears it later', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const switched = await runScript(app, [{ key: '2' }], { ctx });
    const switchedFrame = switched.frames[switched.frames.length - 1]!;
    expect(frameText(switchedFrame)).toContain('Cabinet of Curiosities');

    const settled = await runScript(app, [
      { key: '2' },
      { pulse: { dt: 2 } },
    ], { ctx });
    const settledFrame = settled.frames[settled.frames.length - 1]!;
    expect(frameText(settledFrame)).not.toContain('Cabinet of Curiosities');
  });

  it('lets the landing screen adjust quality before entering the docs and shows feedback', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const changed = await runScript(app, [{ key: KEY_DOWN }], { ctx });
    const frame = changed.frames[changed.frames.length - 1]!;
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect(activeDocsPageModel(changed.model).landingQualityMode).toBe('quality');
    expect(frameText(frame)).toContain('Landing quality: Quality');
    expect(footer).toContain('60 fps • quality');
  });

  it('expands a family, selects a story, and cycles its variants', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model).route).toBe('docs');
    expect(pageModel.selectedStoryId).toBe('alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect(text).toContain('active variant');
    expect(text).toContain('Current selection');
    expect(text).toContain('Warning');
    expect(text).toContain('Profile');
    expect(text).toContain('Rich');
    expect(text).toContain('Description');
  });

  it('opens component search with / and jumps directly to a component story', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'm' },
      { key: 'o' },
      { key: 'd' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const frame = result.frames[result.frames.length - 1]!;
    const text = frameText(frame);

    expect(pageModel.selectedStoryId).toBe('modal');
    expect(pageModel.expandedFamilies['overlays-and-interruption']).toBe(true);
    expect((result.model).docsModel.commandPalette).toBeUndefined();
    expect(text).toContain('modal()');
    expect(text).toContain('Confirm deploy');
  });

  it('opens documentation search with / and prioritizes the table component result', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 'l' },
      { key: 'e' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model).docsModel.activePageId).toBe('components');
    expect(pageModel.selectedStoryId).toBe('dense-comparison');
    expect(pageModel.expandedFamilies['data-and-browsing']).toBe(true);
    expect(text).toContain('table() / navigableTableSurface()');
  });

  it('opens documentation search results on other DOGFOOD pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'm' },
      { key: 'i' },
      { key: 'g' },
      { key: 'r' },
      { key: 'a' },
      { key: 't' },
      { key: 'i' },
      { key: 'o' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'release');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model).docsModel.activePageId).toBe('release');
    expect(pageModel.selectedGuideId).toContain('release-migration');
    expect(text).toContain('Migration Guide');
  });

  it('lets documentation search results be browsed with arrow keys before selection', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 'l' },
      { key: 'e' },
      { key: KEY_DOWN },
    ], { ctx });

    expect((result.model).docsModel.commandPalette?.query).toBe('table');
    expect((result.model).docsModel.commandPalette?.focusIndex).toBe(1);
    expect(frameText(result.frames[result.frames.length - 1]!)).toContain('Search documentation');
  });

  it('can open the new inspector story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'i' },
      { key: 'n' },
      { key: 's' },
      { key: 'p' },
      { key: 'e' },
      { key: 'c' },
      { key: 't' },
      { key: 'o' },
      { key: 'r' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('inspector');
    expect(text).toContain('inspector()');
    expect(text).toContain('Current selection');
    expect(text).toContain('package summary');
  });

  it('can open the new toast story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'o' },
      { key: 'a' },
      { key: 's' },
      { key: 't' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('toast');
    expect(text).toContain('toast()');
    expect(text).toContain('Operation saved.');
  });

  it('can open the new markdown story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'm' },
      { key: 'a' },
      { key: 'r' },
      { key: 'k' },
      { key: 'd' },
      { key: 'o' },
      { key: 'w' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('markdown');
    expect(text).toContain('markdown()');
    expect(text).toContain('Release note');
    expect(text).toContain('This slice');
    expect(text).toContain('Bijou keeps docs');
  });
});
