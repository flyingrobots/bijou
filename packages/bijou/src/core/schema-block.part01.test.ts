import { describe, expect, it } from 'vitest';
import { defineBlock } from './block-metadata.js';
import { bindSchemaBlockInput, defineBlockSchemaAdapter, defineSchemaBlock, isBlockSchemaAdapter, isSchemaBoundBlockDefinition, parseBlockSchema } from './schema-block.js';
import { defineArticleSchema, readerSurfaceMetadata, type Article } from './schema-block.test-support.js';

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
});
