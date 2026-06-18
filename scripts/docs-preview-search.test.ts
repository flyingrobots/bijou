import {
  afterEach,
  COMPONENT_STORIES,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_CTRL_P,
  KEY_DOWN,
  KEY_ENTER,
  KEY_ESCAPE,
  KEY_NEXT_TAB,
  normalizeViewOutput,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';
import { must } from '@flyingrobots/bijou/adapters/test';
describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('demonstrates every table variant in the DOGFOOD dense-comparison story', () => {
    const story = COMPONENT_STORIES.find((candidate) => candidate.id === 'dense-comparison');
    expect(story).toBeDefined();
    const variantIds = story?.variants.map((variant) => variant.id);
    expect(variantIds).toEqual([
      'box',
      'ascii-grid',
      'ruled',
      'header-rule',
      'plain',
      'markdown-table',
      'definition',
      'expanded',
      'pipe-tsv',
      'pipe-csv',
      'pipe-markdown',
      'pipe-ascii-grid',
      'focused-inspection',
    ]);
    const renderVariant = (variantId: string): string => {
      const variant = story?.variants.find((candidate) => candidate.id === variantId);
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 64, rows: 24 } });
      const preview = must(variant).render({
        width: 60,
        ctx,
        state: undefined,
        timeMs: 0,
      });
      if (typeof preview === 'string') return preview;
      return frameText(normalizeViewOutput(preview, { width: 60, height: 24 }).surface);
    };
    expect(renderVariant('box')).toContain('┌');
    expect(renderVariant('ascii-grid')).toContain('+');
    expect(renderVariant('ruled')).toContain('━━━━━━━━');
    expect(renderVariant('header-rule')).toContain('---------');
    expect(renderVariant('plain')).toContain('Component');
    expect(renderVariant('markdown-table')).toContain('| Component');
    expect(renderVariant('definition')).toContain('Field');
    expect(renderVariant('definition')).toContain('Value');
    expect(renderVariant('expanded')).toContain('-[ RECORD 1 ]');
    expect(renderVariant('pipe-tsv')).toContain('Component\tBehavior\tOwner');
    expect(renderVariant('pipe-csv')).toContain('Component,Behavior,Owner');
    expect(renderVariant('pipe-csv')).toContain('"Exports rows to TSV, CSV, Markdown, or ASCII grid."');
    expect(renderVariant('pipe-markdown')).toContain('| Component');
    expect(renderVariant('pipe-ascii-grid')).toContain('+');
    expect(renderVariant('focused-inspection')).toContain('focused table');
  });
  it('renders the Documentation Map guide tables instead of leaking raw markdown', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'guides');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedGuideId).toBe('documentation-map');
    expect(text).toContain('┌');
    expect(text).toContain('┬');
    expect(text).toContain('Surface');
    expect(text).toContain('Role');
    expect(text).toContain('Public front door');
    expect(text).not.toContain('| Surface | Role |');
    expect(text).not.toContain('| :--- | :--- |');
  });
  it('renders the hyperlink story without OSC 8 width corruption', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'h' },
      { key: 'y' },
      { key: 'p' },
      { key: 'e' },
      { key: 'r' },
      { key: 'l' },
      { key: 'i' },
      { key: 'n' },
      { key: 'k' },
      { key: KEY_ENTER },
    ], { ctx });
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(text).toContain('hyperlink()');
    expect(text).toContain('Repository:');
    expect(text).toContain('flyingrobots/bijou');
    expect(text).toContain('API docs:');
    expect(text).toContain('README reference');
    expect(text).not.toContain('https://github.com/flyingrobots/bijou#readmeREA');
  });
  it('can open the new confirm story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'c' },
      { key: 'o' },
      { key: 'n' },
      { key: 'f' },
      { key: 'i' },
      { key: 'r' },
      { key: 'm' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('confirm');
    expect(text).toContain('confirm()');
    expect(text).toContain('Deploy to production?');
    expect(text).toContain('Default');
    expect(text).toContain('No');
  });
  it('can open the new tabs story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 's' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('tabs');
    expect(text).toContain('tabs()');
    expect(text).toContain('Current pane');
    expect(text).toContain('Rollout');
  });
  it('can open the new group and wizard story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'w' },
      { key: 'i' },
      { key: 'z' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('group-wizard');
    expect(text).toContain('group() / wizard()');
    expect(text).toContain('Step 2 of 3');
    expect(text).toContain('Verification');
  });
  it('can open the new explainability story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'e' },
      { key: 'x' },
      { key: 'p' },
      { key: 'l' },
      { key: 'a' },
      { key: 'i' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('explainability');
    expect(text).toContain('explainability()');
    expect(text).toContain('[AI]');
    expect(text).toContain('Evidence');
    expect(text).toContain('Promote the canary build');
  });
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
