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
  runScript,
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

  it('lets the landing screen adjust quality before entering the docs and shows feedback', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const changed = await runScript(app, [{ key: KEY_DOWN }], { ctx });
    const frame = last(changed.frames);
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect(activeDocsPageModel(changed.model).landingQualityMode).toBe('quality');
    expect(frameText(frame)).toContain('Landing quality: Quality');
    expect(footer).toContain('60 fps • quality');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
    const text = frameText(last(result.frames));

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
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
    const text = frameText(last(result.frames));

    expect(pageModel.selectedStoryId).toBe('modal');
    expect(pageModel.expandedFamilies['overlays-and-interruption']).toBe(true);
    expect((result.model).docsModel.commandPalette).toBeUndefined();
    expect(text).toContain('modal()');
    expect(text).toContain('Confirm deploy');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
    const text = frameText(last(result.frames));

    expect((result.model).docsModel.activePageId).toBe('components');
    expect(pageModel.selectedStoryId).toBe('dense-comparison');
    expect(pageModel.expandedFamilies['data-and-browsing']).toBe(true);
    expect(text).toContain('table() / navigableTableSurface()');
  });
});
