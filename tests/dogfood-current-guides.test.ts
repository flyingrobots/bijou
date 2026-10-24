import { describe, expect, it } from 'vitest';
import { createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { createDocsI18nRuntime } from '../examples/docs/app-i18n-runtime.js';
import { createDocsApp } from '../examples/docs/app.js';
import { GUIDE_DOCS } from '../examples/docs/app-guide-catalog.js';
import { guideDocBody, guideDocTitle } from '../examples/docs/app-guide-access.js';
import { documentationSearchItems } from '../examples/docs/app-search.js';
import { BIJOU_VERSION } from '../examples/docs/app-ids.js';
import { documentationFileExists, readDocumentationFile } from '../scripts/documentation-corpus.js';
import { resolve } from 'node:path';

function guide(id: string) {
  const result = GUIDE_DOCS.find((doc) => doc.id === id);
  if (result === undefined) throw new Error(`Missing guide: ${id}`);
  return result;
}

describe('current DOGFOOD documentation', () => {
  it.each(['en', 'de', 'es', 'fr'])('publishes translated recent features and MCP guidance in %s', (locale) => {
    const port = createRuntimeLocalizationPort(createDocsI18nRuntime({ locale }));
    const current = guide('latest-features');
    const body = guideDocBody(current, port);
    expect(guideDocTitle(current, port)).not.toBe('latest-features');
    expect(body).toContain(BIJOU_VERSION);
    for (const feature of ['RasterFontGlyph', 'layoutRasterText', 'rasterizeText', 'rasterTextSurface',
      '--configure', '--ELEMENT-font', '--ELEMENT-size', '--no-animation', 'NO_COLOR',
      'Jacquard 12', 'Space Grotesk', 'check:dogfood:prompt', '7.2.0']) {
      expect(body).toContain(feature);
    }
    expect(body).not.toMatch(/\{\{[A-Z_]+\}\}/u);
    const mcp = guideDocBody(guide('package-bijou-mcp'), port);
    expect(mcp).toContain('structuredContent');
    expect(mcp).toMatch(/OSC[- ]8/u);
    expect(mcp).toContain('#545');
    expect(mcp).toContain('bijou_docs');
    const notice = port.resolve({ key: { namespace: 'bijou.dogfood', id: 'docs.historicalSourceNotice' } });
    expect(notice.status).toBe('translated');
    if (typeof notice.value !== 'string') throw new Error('Missing translated archive notice.');
    expect(guideDocBody(guide('philosophy-architecture'), port)).toContain(notice.value);
  });

  it('makes the new articles discoverable through actual documentation search items', () => {
    const port = createRuntimeLocalizationPort(createDocsI18nRuntime());
    const items = documentationSearchItems(port);
    const current = items.find((item) => item.id === 'doc:guides:latest-features');
    expect(current?.searchText).toContain('RasterFont');
    expect(current?.searchText).toContain('--h1-size');
    expect(current?.targetPageId).toBe('guides');
    expect(items.find((item) => item.id === 'doc:packages:package-bijou-mcp')?.searchText).toContain('structuredContent');
  });

  it('opens both current guides through the real reader routes', async () => {
    for (const [pageId, guideId, expected] of [
      ['guides', 'latest-features', 'RasterFont'],
      ['packages', 'package-bijou-mcp', 'bijou_table'],
    ] as const) {
      const ctx = createTestContext({ runtime: { columns: 140, rows: 60 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: pageId });
      const result = await runScript(app, [{ msg: { type: 'docs', msg: { type: 'select-guide', guideId } } }], { ctx });
      const frame = result.frames.at(-1);
      if (frame === undefined) throw new Error('Missing guide frame.');
      const text = Array.from({ length: frame.height }, (_, y) => Array.from({ length: frame.width }, (_, x) => frame.get(x, y).char).join('')).join('\n');
      expect(result.model.docsModel.activePageId).toBe(pageId);
      expect(result.model.docsModel.pageModels[pageId]?.selectedGuideId).toBe(guideId);
      expect(text).toContain(expected);
    }
  });

  it('labels frozen reader articles without altering their underlying source bodies', () => {
    for (const id of ['secondary-example-map', 'blocks-what-are-blocks',
      'philosophy-system-style-javascript', 'philosophy-architecture',
      'philosophy-ux-doctrine', 'philosophy-invariants', 'philosophy-design-system',
      'release-whats-new-8-0-0', 'release-migration-8-0-0']) {
      const doc = guide(id);
      const shown = guideDocBody(doc);
      expect(shown).toContain('Historical reference');
      expect(shown).toContain('Latest Features');
      expect(shown.endsWith(doc.body)).toBe(true);
      expect(doc.body).not.toContain('Historical reference from the preserved documentation archive.');
    }
    expect(guideDocBody(guide('latest-features')).startsWith('Historical reference')).toBe(false);
    expect(documentationFileExists(resolve('docs/ARCHITECTURE.md'))).toBe(true);
    expect(readDocumentationFile(resolve('examples/docs/content/release-story-current.md'), 'utf8')).toContain('v7.2 release story');
  });
});
