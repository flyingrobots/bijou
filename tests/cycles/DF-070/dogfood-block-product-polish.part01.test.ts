import { describe, expect, it } from 'vitest';

import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';

import { runScript } from '@flyingrobots/bijou-tui';

import { createDocsApp } from '../../../examples/docs/app.js';
import { documentationArticleBlock, guideInspectorBlock, navigationListBlock } from '../../../examples/docs/dogfood-blocks.js';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-070 DOGFOOD block product polish', () => {
  it('renders documentation article body data through DocumentationArticleBlock', () => {
    const rendered = documentationArticleBlock.render({
      config: {
        title: 'Readable article',
        body: '# Readable article\n\nThis article body is the product content.',
        headingCount: 1,
      },
      mode: 'interactive',
    });

    expect(rendered.output).toContain('# Readable article');
    expect(rendered.output).toContain('This article body is the product content.');
    expect(rendered.output).not.toContain('DocumentationArticleBlock');
    const fallback = documentationArticleBlock.render({
      config: {
        title: 'Readable article',
        headingCount: 2,
      },
      mode: 'interactive',
    });
    expect(fallback.facts).toContainEqual({
      kind: 'state',
      key: 'dogfood.documentation.headingCount',
      value: '2',
    });
  });
});

describe('DF-070 DOGFOOD block product polish', () => {
  it('renders concrete navigation rows through NavigationListBlock', () => {
    const rendered = navigationListBlock.render({
      config: {
        items: [
          { id: 'guides', label: 'Guides' },
          { id: 'blocks', label: 'Blocks' },
        ],
        activeItemId: 'blocks',
      },
      mode: 'accessible',
    });
    expect(rendered.output).toContain('Guides');
    expect(rendered.output).toContain('> Blocks');
    expect(rendered.output).not.toContain('items: 2');
  });
});

describe('DF-070 DOGFOOD block product polish', () => {
  it('marks the focused navigation row in lowered DOGFOOD nav output before selection', async () => {
    const ctx = createTestContext({ mode: 'accessible', runtime: { columns: 100, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'guides' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'guide-next' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const guideModel = result.model.docsModel.pageModels.guides;
    expect(guideModel.selectedGuideId).toBe('start-here');
    expect(guideModel.guideState.focusIndex).toBe(1);
    expect(text).toContain('- Start Here');
    expect(text).toContain('> Navigate DOGFOOD');
  });
});

describe('DF-070 DOGFOOD block product polish', () => {
  it('renders guide inspector sections through GuideInspectorBlock', () => {
    const rendered = guideInspectorBlock.render({
      config: {
        selectionLabel: 'Blocks',
        sections: [
          {
            title: 'Summary',
            content: 'Block authoring and preview guidance.',
            tone: 'muted',
          },
          {
            title: 'Current posture',
            content: 'DOGFOOD publishes block docs from real contracts.',
            tone: 'muted',
          },
        ],
      },
      mode: 'accessible',
    });
    expect(rendered.output).toContain('Guide inspector: Blocks');
    expect(rendered.output).toContain('Summary: Block authoring and preview guidance.');
    expect(rendered.output).toContain('Current posture: DOGFOOD publishes block docs from real contracts.');
    expect(rendered.output).not.toContain('facts: 2');
  });
});
