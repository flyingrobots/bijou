import { describe, expect, it } from 'vitest';
import { commandIntent, defineDataRequirement, defineViewData } from './binding.js';
import { defineBlock } from './block-metadata.js';
import { bindSchemaBlockInput, defineSchemaBlock } from './schema-block.js';
import { defineArticleSchema, readerSurfaceMetadata } from './schema-block.test-support.js';

describe('schema-bound block contract', () => {
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
