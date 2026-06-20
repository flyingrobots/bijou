import { describe, expect, it } from 'vitest';
import {
  commandIntent,
  defineDataRequirement,
  defineViewData,
} from './binding.js';
import {
  defineBlock,
} from './block-metadata.js';
import {
  bindSchemaBlockInput,
  defineBlockSchemaAdapter,
  defineSchemaBlock,
  isBlockSchemaAdapter,
  isSchemaBoundBlockDefinition,
  parseBlockSchema,
} from './schema-block.js';
import {
  defineArticleSchema,
  readerSurfaceMetadata,
  type Article,
} from './schema-block.test-support.js';

describe('schema-bound block contract', () => {
  it('creates branded schema adapters and schema-bound blocks around block definitions', () => {
    const articleSchema = defineArticleSchema();
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: ({ config }) => ({ output: config }),
    });
    const schemaBlock = defineSchemaBlock({
      block,
      schema: articleSchema,
      bind: (article) => ({ config: { heading: article.title } }),
    });

    expect(articleSchema.id).toBe('docs.article');
    expect(isBlockSchemaAdapter(articleSchema)).toBe(true);
    expect(isSchemaBoundBlockDefinition(schemaBlock)).toBe(true);
    expect(Object.isFrozen(articleSchema)).toBe(true);
    expect(Object.isFrozen(schemaBlock)).toBe(true);
    expect(schemaBlock.block.metadata).toBe(block.metadata);
    expect(schemaBlock.schema).toBe(articleSchema);
  });

  it('snapshots adapter callbacks when the schema adapter is defined', () => {
    const schemaInput = {
      id: 'docs.article',
      parse: (): { readonly ok: true; readonly data: Article } => ({
        ok: true,
        data: { id: 'original', title: 'Original' },
      }),
      describe: () => ({ requiredFields: ['id'] }),
    };
    const articleSchema = defineBlockSchemaAdapter<Article>(schemaInput);

    schemaInput.parse = () => ({
      ok: true,
      data: { id: 'mutated', title: 'Mutated' },
    });
    schemaInput.describe = () => ({ requiredFields: ['mutated'] });

    expect(parseBlockSchema(articleSchema, {})).toEqual({
      ok: true,
      data: { id: 'original', title: 'Original' },
    });
    expect(articleSchema.describe?.()).toMatchObject({
      requiredFields: ['id'],
    });
  });

  it('validates unknown boundary data into immutable typed data or immutable issues', () => {
    const articleSchema = defineArticleSchema();
    const valid = parseBlockSchema(articleSchema, {
      id: 'dx-034',
      title: 'DX-034',
      tags: ['binding'],
    });
    const invalid = parseBlockSchema(articleSchema, undefined);

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.data).toEqual({
        id: 'dx-034',
        title: 'DX-034',
        tags: ['binding'],
      });
      expect(Object.isFrozen(valid)).toBe(true);
      expect(Object.isFrozen(valid.data)).toBe(true);
      expect(Object.isFrozen(valid.data.tags)).toBe(true);
      expect(() => {
        Object.defineProperty(valid.data, 'title', { value: 'mutated' });
      }).toThrow(TypeError);
    }

    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.issues).toEqual([{
        severity: 'error',
        code: 'article.invalid',
        message: 'Article data is required.',
        path: 'article',
      }]);
      expect(Object.isFrozen(invalid)).toBe(true);
      expect(Object.isFrozen(invalid.issues)).toBe(true);
      expect(Object.isFrozen(invalid.issues[0])).toBe(true);
      expect(() => {
        Object.defineProperty(invalid.issues, 'extra', { value: {
          severity: 'error',
          code: 'article.extra',
          message: 'extra',
        } });
      }).toThrow(TypeError);
    }
  });

  it('validates schema data before bind output is consumed and never renders for validation', () => {
    let bindCalls = 0;
    let renderCalls = 0;
    const articleSchema = defineArticleSchema();
    const block = defineBlock<{ heading: string }, string>({
      metadata: readerSurfaceMetadata,
      render: ({ config }) => {
        renderCalls += 1;
        return { output: config?.heading ?? '' };
      },
    });
    const schemaBlock = defineSchemaBlock({
      block,
      schema: articleSchema,
      bind: (article) => {
        bindCalls += 1;
        return {
          input: { config: { heading: article.title } },
          facts: [{ kind: 'entity', key: 'article', value: article.id }],
        };
      },
    });

    const invalid = bindSchemaBlockInput(schemaBlock, undefined);
    expect(invalid.ok).toBe(false);
    expect(bindCalls).toBe(0);
    expect(renderCalls).toBe(0);

    const valid = bindSchemaBlockInput(schemaBlock, {
      id: 'dx-031',
      title: 'DX-031',
    });
    expect(valid).toMatchObject({
      ok: true,
      input: { config: { heading: 'DX-031' } },
      facts: [{ kind: 'entity', key: 'article', value: 'dx-031' }],
    });
    expect(bindCalls).toBe(1);
    expect(renderCalls).toBe(0);
    if (valid.ok) {
      expect(Object.isFrozen(valid.input)).toBe(true);
      expect(Object.isFrozen(valid.input.config)).toBe(true);
      expect(Object.isFrozen(valid.facts)).toBe(true);
    }
  });

  it('rejects unsupported bind output keys instead of dropping them silently', () => {
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: () => ({ output: 'reader' }),
    });
    const topLevelTypo = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      // @ts-expect-error runtime guard coverage for unsupported bind output keys.
      bind: () => ({ slotz: { content: 'typo' } }),
    });
    const wrappedTypo = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      // @ts-expect-error runtime guard coverage for unsupported wrapped input keys.
      bind: () => ({ input: { slotz: { content: 'typo' } } }),
    });
    const backchannel = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      bind: () => ({
        input: { slots: { content: 'safe' } },
        dispatch: () => undefined,
      }),
    });

    expect(() => bindSchemaBlockInput(topLevelTypo, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: unsupported bind output key slotz');
    expect(() => bindSchemaBlockInput(wrappedTypo, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: unsupported input key slotz');
    expect(() => bindSchemaBlockInput(backchannel, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: unsupported bind output key dispatch');
  });

  it('rejects non-plain bind outputs instead of normalizing them to empty input', () => {
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: () => ({ output: 'reader' }),
    });
    const dateOutput = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      // @ts-expect-error runtime guard coverage for non-plain bind output.
      bind: () => new Date(0),
    });
    const wrappedDateInput = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      // @ts-expect-error runtime guard coverage for non-plain wrapped input.
      bind: () => ({ input: new Date(0) }),
    });
    const arrayOutput = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      // @ts-expect-error runtime guard coverage for array bind output.
      bind: () => [],
    });

    expect(() => bindSchemaBlockInput(dateOutput, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: bind output must be a plain object');
    expect(() => bindSchemaBlockInput(wrappedDateInput, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: input must be a plain object');
    expect(() => bindSchemaBlockInput(arrayOutput, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: bind output must be a plain object');
  });

  it('preserves data and command contracts without taking ownership of provider lifecycle', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const data = defineViewData({
      id: 'reader.data',
      requirements: [{ name: 'article', requirement: article }],
    });
    const openArticle = commandIntent<{ articleId: string }>('reader.openArticle');
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      data,
      commands: [openArticle],
      render: () => ({ output: 'reader' }),
    });
    const schemaBlock = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      bind: (schemaArticle) => ({ slots: { content: schemaArticle.title } }),
    });

    expect(schemaBlock.block.data).toBe(data);
    expect(schemaBlock.block.commands).toEqual([openArticle]);
    expect(schemaBlock.block.data?.requirement('article')).toBe(article);
    expect(schemaBlock.block.commands?.[0]).toBe(openArticle);
    expect('provider' in schemaBlock).toBe(false);
    expect('subscribe' in schemaBlock).toBe(false);
    expect('refresh' in schemaBlock).toBe(false);
    expect('dispatch' in schemaBlock).toBe(false);
  });
});
