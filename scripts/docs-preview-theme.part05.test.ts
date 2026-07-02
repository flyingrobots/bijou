import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
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
});
