import { describe, expect, it } from 'vitest';
import {
  bindSchemaBlockInput,
  defineBlock,
  defineBlockSchemaAdapter,
  defineSchemaBlock,
  type BlockMetadata,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

interface Article {
  readonly id: string;
  readonly title: string;
}

const readerSurfaceMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'ReaderSurface',
  family: 'content-reading',
  scale: 'section',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: {
    summary: 'Readable content with optional navigation and outline slots.',
  },
  slots: [
    { id: 'content', required: true },
    { id: 'navigation', required: false },
    { id: 'outline', required: false },
  ],
};

describe('DX-031B schema-bound block contract', () => {
  it('binds validated schema data into block render input without rendering or provider lifecycle', () => {
    let renderCalls = 0;
    const articleSchema = defineBlockSchemaAdapter<Article>({
      id: 'docs.article',
      parse(input) {
        if (!isArticle(input)) {
          return {
            ok: false,
            issues: [{
              severity: 'error',
              code: 'article.invalid',
              message: 'Article data is required.',
            }],
          };
        }

        return {
          ok: true,
          data: { id: input.id, title: input.title },
        };
      },
    });
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: () => {
        renderCalls += 1;
        return { output: 'reader' };
      },
    });
    const schemaBlock = defineSchemaBlock({
      block,
      schema: articleSchema,
      bind: (article) => ({
        slots: { content: article.title },
      }),
    });

    const bound = bindSchemaBlockInput(schemaBlock, {
      id: 'dx-031',
      title: 'DX-031',
    });

    expect(bound).toMatchObject({
      ok: true,
      input: { slots: { content: 'DX-031' } },
    });
    expect(schemaBlock.block.metadata.blockName).toBe('ReaderSurface');
    expect(renderCalls).toBe(0);
    expect('provider' in schemaBlock).toBe(false);
    expect('subscribe' in schemaBlock).toBe(false);
    expect('dispatch' in schemaBlock).toBe(false);
  });

  it('documents schema-bound blocks as boundary validation, not rendered AppShell or provider runtime', () => {
    const dx031 = readRepoFile('docs/design/DX-031-standard-bijou-blocks.md');
    const blocks = readRepoFile('docs/design-system/blocks.md');

    expect(dx031).toContain('DX-031B Schema-Bound Blocks');
    expect(dx031).toContain('Schema-bound blocks validate boundary data');
    expect(dx031).toContain('SchemaBoundBlock "1" *-- "1" BlockDefinition : wraps');
    expect(dx031).not.toContain('SchemaBoundBlock "1" --|> BlockDefinition : specializes');
    expect(dx031).toContain('They do not fetch,');
    expect(dx031).toContain('subscribe, dispatch, compose runtime views, or render AppShell');
    expect(blocks).toContain('Schema-bound blocks validate unknown boundary data');
  });
});

function isArticle(input: unknown): input is Article {
  if (input === null || typeof input !== 'object') {
    return false;
  }

  const article = input as Partial<Article>;
  return typeof article.id === 'string' && typeof article.title === 'string';
}
