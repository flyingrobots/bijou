import {
  activeDocsPageModel,
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_ENTER,
  keyMsg,
  normalizeViewOutput,
  readFileSync,
  runScript,
  TOKEN_DOCTRINE_PATH,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

type DocsFrame = Parameters<typeof frameText>[0];

function last(frames: readonly DocsFrame[]): DocsFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('Missing frame');
  return frame;
}

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('shows a toast with the theme name when the landing theme changes and clears it later', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const switched = await runScript(app, [{ key: '2' }], { ctx });
    expect(frameText(last(switched.frames))).toContain('Cabinet of Curiosities');
    const settled = await runScript(app, [
      { key: '2' },
      { pulse: { dt: 2 } },
    ], { ctx });
    expect(frameText(last(settled.frames))).not.toContain('Cabinet of Curiosities');
  });
});
