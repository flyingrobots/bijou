import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  KEY_ESCAPE,
  KEY_NEXT_TAB,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('can open the new help story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'h' },
      { key: 'e' },
      { key: 'l' },
      { key: 'p' },
      { key: 'v' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('help-view');
    expect(text).toContain('helpView() / helpShortSurface()');
    expect(text).toContain('Keyboard shortcuts');
    expect(text).toContain('Navigation');
    expect(text).toContain('Open help');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('can open the new app-shell story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'a' },
      { key: 'p' },
      { key: 'p' },
      { key: '-' },
      { key: 's' },
      { key: 'h' },
      { key: 'e' },
      { key: 'l' },
      { key: 'l' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('app-shell');
    expect(text).toContain('createFramedApp()');
    expect(text).toContain('command palette');
    expect(text).toContain('Current page');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps ctrl+p as the generic command palette while / is documentation search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const openedSearch = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
    ], { ctx });
    expect(frameText(must(openedSearch.frames[openedSearch.frames.length - 1]))).toContain('Search documentation');
    const openedPalette = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_CTRL_P },
    ], { ctx });
    const paletteText = frameText(must(openedPalette.frames[openedPalette.frames.length - 1]));
    expect(paletteText).toContain('Command Palette');
    expect(paletteText).not.toContain('Search documentation');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('closes documentation search with escape without opening quit confirm', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: KEY_ESCAPE },
    ], { ctx });
    expect((result.model).docsModel.commandPalette).toBeUndefined();
    expect((result.model).docsModel.quitConfirmOpen).toBe(false);
    const frame = must(result.frames[result.frames.length - 1]);
    const text = frameText(frame);
    expect(text).not.toContain('Search documentation');
    expect(text).toContain('welcome to bijou');
  });
});
