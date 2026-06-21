
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
  KEY_DOWN,
  KEY_ENTER,
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
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});
