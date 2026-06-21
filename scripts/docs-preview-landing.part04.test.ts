import {
  afterEach,
  assertReadableDogfoodTheme,
  BIJOU_DARK,
  BIJOU_LIGHT,
  createDocsApp,
  createTestContext,
  describe,
  docsShellThemesForTesting,
  expect,
  frameText,
  it,
  KEY_ENTER,
  KEY_F10,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('ships one DogFood shell theme family with readable dark and light modes', () => {
    const shellThemes = docsShellThemesForTesting();
    const dogfood = shellThemes.find((theme) => theme.id === 'dogfood');
    const dark = dogfood?.modes?.find((mode) => mode.id === 'dark');
    const light = dogfood?.modes?.find((mode) => mode.id === 'light');

    expect(shellThemes[0]?.id).toBe('dogfood');
    expect(dogfood?.label).toBe('DOGFOOD');
    expect(dark?.label).toBe('Dark');
    expect(light?.label).toBe('Light');
    expect(dark?.theme.name).toBe('dogfood-dark');
    expect(light?.theme.name).toBe('dogfood-light');

    assertReadableDogfoodTheme(must(dark).theme);
    assertReadableDogfoodTheme(must(light).theme);

    expect(dark?.theme.semantic.primary.hex).toBe(BIJOU_DARK.semantic.primary.hex);
    expect(dark?.theme.surface.primary.bg).toBe(BIJOU_DARK.surface.primary.bg);
    expect(light?.theme.semantic.primary.hex).toBe(BIJOU_LIGHT.semantic.primary.hex);
    expect(light?.theme.surface.primary.bg).toBe(BIJOU_LIGHT.surface.primary.bg);
    expect(dark?.theme.semantic.primary.hex).not.toBe(dark?.theme.semantic.accent.hex);
    expect(dark?.theme.ui.cursor.hex).not.toBe(dark?.theme.status.info.hex);
    expect(light?.theme.semantic.primary.hex).not.toBe(light?.theme.semantic.accent.hex);
    expect(light?.theme.ui.cursor.hex).not.toBe(light?.theme.status.info.hex);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('opens the Theme Inspector drawer with F10 and keeps it bounded', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 42 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }], { ctx });
    const openedText = frameText(must(opened.frames.at(-1)));

    expect((opened.model).route).toBe('docs');
    expect((opened.model).themeInspectorOpen).toBe(true);
    expect(openedText).toContain('Theme Inspector');
    expect(openedText).toContain('Active: DOGFOOD / Dark');
    expect(openedText).toContain('semantic.primary');
    expect(openedText).toContain('surface.primary');
    expect(openedText).toContain('safe pairs pass');
    const closed = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }, { key: KEY_F10 }], { ctx });
    expect((closed.model).themeInspectorOpen).toBe(false);
    expect(frameText(must(closed.frames.at(-1)))).not.toContain('Theme Inspector');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the Theme Inspector drawer inside narrow terminal bounds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 30, rows: 18 } });
    const app = createDocsApp(ctx);
    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }], { ctx });
    const frame = must(opened.frames.at(-1));
    expect((opened.model).themeInspectorOpen).toBe(true);
    expect(frame.width).toBe(30);
    expect(frame.height).toBe(18);
    expect(frameText(frame)).toContain('Theme Inspector');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('lets q open the normal quit confirmation while the Theme Inspector is open', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 42 } });
    const app = createDocsApp(ctx);
    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }, { key: 'q' }], { ctx });
    expect((opened.model).themeInspectorOpen).toBe(false);
    expect((opened.model).docsModel.quitConfirmOpen).toBe(true);
    expect(frameText(must(opened.frames.at(-1)))).toContain('Quit?');
  });
});
