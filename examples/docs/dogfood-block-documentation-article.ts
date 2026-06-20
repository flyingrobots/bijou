import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

export interface DocumentationArticleBlockConfig {
  readonly title?: string;
  readonly body?: string;
  readonly headingCount?: number;
}

export const documentationArticleRequirement = defineDataRequirement({
  id: 'documentation.article',
  resource: 'dogfood.documentation.article',
  label: 'Documentation article',
  description: 'Current DOGFOOD documentation article body.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
});

export const documentationHeadingsRequirement = defineDataRequirement({
  id: 'documentation.headings',
  resource: 'dogfood.documentation.headings',
  label: 'Article headings',
  description: 'Headings discovered from the active DOGFOOD documentation article.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
});

export const documentationArticleData = defineViewData({
  id: 'documentation-article.data',
  label: 'DocumentationArticleBlock data',
  description: 'DOGFOOD article content and heading outline.',
  requirements: [
    { name: 'article', requirement: documentationArticleRequirement },
    { name: 'headings', requirement: documentationHeadingsRequirement },
  ],
});

export const documentationSelectHeadingIntent = commandIntent<{ readonly headingId: string }>(
  'documentation.selectHeading',
  {
    label: 'Select heading',
    description: 'Request navigation to a heading in the active article.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DocumentationArticleBlock' }],
  },
);

export const documentationOpenReferenceIntent = commandIntent<{ readonly referenceId: string }>(
  'documentation.openReference',
  {
    label: 'Open reference',
    description: 'Request opening a referenced doc, package, or source path.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DocumentationArticleBlock' }],
  },
);

export const documentationArticleBlock: BlockDefinition<DocumentationArticleBlockConfig, string> =
  defineBlock({
    metadata: {
      packageName: DOGFOOD_BLOCK_PACKAGE,
      blockName: 'DocumentationArticleBlock',
      family: 'dogfood-documentation',
      scale: 'section',
      modes: DOGFOOD_BLOCK_MODES,
      docs: {
        summary: 'Owns a DOGFOOD documentation article and its local heading/reference intents.',
        useWhen: ['DOGFOOD needs to render a documentation article as a semantic content block.'],
        avoidWhen: ['A surface is only selecting which article should be active.'],
        relatedDocs: ['docs/README.md', 'docs/DOGFOOD.md'],
      },
      sourcePath: 'examples/docs/app.ts',
      slots: [
        { id: 'article', required: true, description: 'Markdown or rendered documentation body.' },
        { id: 'outline', required: false, description: 'Article heading outline.' },
      ],
      variants: [
        {
          id: 'article',
          label: 'Article',
          requiredSlots: ['article'],
          optionalSlots: ['outline'],
          facts: [{ kind: 'state', key: 'dogfood.documentation.layout', value: 'article' }],
        },
      ],
      composedComponents: ['markdown()', 'viewportSurface()', 'link()'],
      semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'DocumentationArticleBlock' }],
      storyIds: ['documentation-article.article'],
      examples: [{ id: 'dogfood.documentation.article', label: 'DOGFOOD article content' }],
      tags: ['dogfood', 'docs', 'article'],
    },
    data: documentationArticleData,
    commands: [
      documentationSelectHeadingIntent,
      documentationOpenReferenceIntent,
    ],
    render: renderDocumentationArticleBlock,
  });

function renderDocumentationArticleBlock(
  input: BlockRenderInput<DocumentationArticleBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title ?? 'Untitled article';
  const body = input.config?.body;
  const headingCount = input.config?.headingCount ?? 0;
  const facts = [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'DocumentationArticleBlock' },
    { kind: 'state' as const, key: 'dogfood.documentation.headingCount', value: s(headingCount) },
  ];

  if (body !== undefined && (input.mode === 'interactive' || input.mode === 'static')) {
    return {
      output: body,
      facts,
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: body === undefined
        ? `Article: ${title}; headings: ${s(headingCount)}`
        : `${title}: ${body.replace(/\s+/g, ' ').trim()}`,
      facts,
    };
  }

  return {
    output: [
      'DocumentationArticleBlock',
      `title: ${title}`,
      `headings: ${s(headingCount)}`,
      'Intents: select heading; open reference',
    ].join('\n'),
    facts,
  };
}
