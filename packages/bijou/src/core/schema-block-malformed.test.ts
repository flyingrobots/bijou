import { describe, expect, it } from 'vitest';
import { defineBlock } from './block-metadata.js';
import {
  bindSchemaBlockInput,
  defineBlockSchemaAdapter,
  defineSchemaBlock,
  parseBlockSchema,
} from './schema-block.js';
import {
  defineArticleSchema,
  readerSurfaceMetadata,
} from './schema-block.test-support.js';

describe('schema-bound block malformed inputs', () => {
  it('rejects loose schema-shaped objects and unsupported schema ids/results', () => {
    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: () => ({ output: 'reader' }),
    });

    // @ts-expect-error runtime guard coverage for loose adapter input.
    expect(() => defineBlockSchemaAdapter(null)).toThrow(Error);
    // @ts-expect-error runtime guard coverage for loose schema block input.
    expect(() => defineSchemaBlock(null)).toThrow(Error);

    expect(() => defineBlockSchemaAdapter({
      id: '   ',
      parse: () => ({ ok: true, data: {} }),
    })).toThrow(Error);

    expect(() => defineSchemaBlock({
      block,
      // @ts-expect-error runtime guard coverage for loose schema-shaped input.
      schema: {
        id: 'docs.article',
        parse: () => ({ ok: true, data: {} }),
      },
      bind: () => ({}),
    })).toThrow(Error);

    expect(() => defineSchemaBlock({
      // @ts-expect-error runtime guard coverage for loose block-shaped input.
      block: {
        metadata: readerSurfaceMetadata,
        render: () => ({ output: 'reader' }),
      },
      schema: defineArticleSchema(),
      bind: () => ({}),
    })).toThrow(Error);

    expect(() => parseBlockSchema(defineBlockSchemaAdapter({
      id: 'docs.invalid',
      parse: () => ({ ok: false, issues: [] }),
    }), {})).toThrow(Error);
  });

  it('reports deterministic errors for malformed untyped schema inputs', () => {
    expect(() => defineBlockSchemaAdapter({
      // @ts-expect-error runtime guard coverage for malformed adapter id.
      id: 42,
      parse: () => ({ ok: true, data: {} }),
    })).toThrow('block schema adapter: id must be a string');

    expect(() => parseBlockSchema(defineBlockSchemaAdapter({
      id: 'docs.invalid',
      // @ts-expect-error runtime guard coverage for malformed issue lists.
      parse: () => {
        return { ok: false, issues: { code: 'bad' } };
      },
    }), {})).toThrow('block schema result: issues must be an array');

    const badDescription = defineBlockSchemaAdapter({
      id: 'docs.description',
      parse: () => ({ ok: true, data: {} }),
      // @ts-expect-error runtime guard coverage for malformed description arrays.
      describe: () => {
        return { requiredFields: 'id' };
      },
    });
    expect(() => badDescription.describe?.()).toThrow(
      'block schema description: requiredFields must be an array',
    );

    const badSchemaFacts = defineBlockSchemaAdapter({
      id: 'docs.facts',
      parse: () => ({ ok: true, data: {} }),
      // @ts-expect-error runtime guard coverage for malformed fact arrays.
      describe: () => {
        return { facts: 'entity:article' };
      },
    });
    expect(() => badSchemaFacts.describe?.()).toThrow(
      'block schema description: facts must be an array',
    );

    const block = defineBlock({
      metadata: readerSurfaceMetadata,
      render: () => ({ output: 'reader' }),
    });
    const badBindFacts = defineSchemaBlock({
      block,
      schema: defineArticleSchema(),
      bind: () => ({
        input: { slots: { content: 'DX-031' } },
        // @ts-expect-error runtime guard coverage for malformed bind facts.
        facts: 'entity:article',
      }),
    });

    expect(() => bindSchemaBlockInput(badBindFacts, {
      id: 'dx-031',
      title: 'DX-031',
    })).toThrow('schema block bind: facts must be an array');
  });
});
