import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
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
    const text = frameText(last(result.frames));

    expect(pageModel.selectedStoryId).toBe('toast');
    expect(text).toContain('toast()');
    expect(text).toContain('Operation saved.');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
    const text = frameText(last(result.frames));

    expect(pageModel.selectedStoryId).toBe('markdown');
    expect(text).toContain('markdown()');
    expect(text).toContain('Release note');
    expect(text).toContain('This slice');
    expect(text).toContain('Bijou keeps docs');
  });
});
