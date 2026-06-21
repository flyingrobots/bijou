
import {
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
    const text = frameText(last(result.frames));

    expect((result.model).docsModel.activePageId).toBe('release');
    expect(pageModel.selectedGuideId).toContain('release-migration');
    expect(text).toContain('Migration Guide');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
    expect(frameText(last(result.frames))).toContain('Search documentation');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
    const text = frameText(last(result.frames));

    expect(pageModel.selectedStoryId).toBe('inspector');
    expect(text).toContain('inspector()');
    expect(text).toContain('Current selection');
    expect(text).toContain('package summary');
  });
});
