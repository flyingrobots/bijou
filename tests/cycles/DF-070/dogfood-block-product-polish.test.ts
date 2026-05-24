import { describe, expect, it } from 'vitest';
import {
  documentationArticleBlock,
  navigationListBlock,
} from '../../../examples/docs/dogfood-blocks.js';

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
  });

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
