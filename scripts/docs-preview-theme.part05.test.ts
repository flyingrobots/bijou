import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_CTRL_P,
  KEY_F2,
  KEY_TAB,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('renders Theme Lab as an editor with a live graph after color edits', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 152, rows: 46 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });

    const result = await runScript(app, [
      { key: KEY_TAB },
      { key: ']' },
      { key: 'b' },
      { key: '+' },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(text).toContain('Theme editor');
    expect(text).toContain('Live token graph');
    expect(text).toContain('Selected: semantic.accent');
    expect(text).toContain('Channel: blue');
    expect(text).toContain('semantic.accent');
    expect(text).toContain('edited');
    expect(text).toContain('-> border.secondary');
    expect(text).toContain('-> ui.cursor');
  });

  it('keeps Theme Lab editor shortcuts scoped to the guide content pane', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 152, rows: 46 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });

    const result = await runScript(app, [
      { key: 'b' },
      { key: '+' },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(result.model.docsModel.focusedPaneByPage.themes).toBe('guide-nav');
    expect(text).toContain('Selected: semantic.primary');
    expect(text).toContain('Channel: red');
    expect(text).not.toContain('edited');
  });

  it('lets Theme Lab search overlays receive printable editor shortcuts', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 152, rows: 46 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });

    const result = await runScript(app, [
      { key: KEY_TAB },
      { key: '/' },
      { key: 'b' },
    ], { ctx });
    const pageModel = result.model.docsModel.pageModels.themes;

    expect(result.model.docsModel.commandPaletteKind).toBe('search');
    expect(result.model.docsModel.commandPalette?.query).toBe('b');
    expect(pageModel?.themeLabEditor).toBeUndefined();
  });

  it('does not consume shifted frame scroll keys as Theme Lab editor shortcuts', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 152, rows: 46 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });

    const result = await runScript(app, [
      { key: KEY_TAB },
      { key: 'G' },
    ], { ctx });
    const pageModel = result.model.docsModel.pageModels.themes;

    expect(pageModel?.themeLabEditor).toBeUndefined();
  });

  it('keeps Theme Lab shortcuts behind settings and command palette overlays', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 152, rows: 46 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });

    const settingsResult = await runScript(app, [
      { key: KEY_TAB },
      { key: KEY_F2 },
      { key: 'b' },
    ], { ctx });
    const paletteResult = await runScript(app, [
      { key: KEY_TAB },
      { key: KEY_CTRL_P },
      { key: 'b' },
    ], { ctx });

    expect(settingsResult.model.docsModel.settingsOpen).toBe(true);
    expect(settingsResult.model.docsModel.pageModels.themes?.themeLabEditor).toBeUndefined();
    expect(paletteResult.model.docsModel.commandPaletteKind).toBe('command');
    expect(paletteResult.model.docsModel.commandPalette?.query).toBe('b');
    expect(paletteResult.model.docsModel.pageModels.themes?.themeLabEditor).toBeUndefined();
  });
});
