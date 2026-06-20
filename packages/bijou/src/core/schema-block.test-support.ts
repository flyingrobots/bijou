import type { BlockMetadata } from './block-metadata.js';
import { defineBlockSchemaAdapter } from './schema-block.js';

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly tags?: readonly string[];
}

export const readerSurfaceMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'ReaderSurface',
  family: 'content-reading',
  scale: 'section',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: {
    summary: 'Composes readable article content with optional navigation and outline slots.',
  },
  slots: [
    { id: 'content', required: true },
    { id: 'navigation', required: false },
    { id: 'outline', required: false },
  ],
};

export function defineArticleSchema() {
  return defineBlockSchemaAdapter<Article>({
    id: ' docs.article ',
    parse(input) {
      if (!isArticleInput(input)) {
        return {
          ok: false,
          issues: [{
            severity: 'error',
            code: 'article.invalid',
            message: 'Article data is required.',
            path: 'article',
          }],
        };
      }

      return {
        ok: true,
        data: {
          id: input.id,
          title: input.title,
          ...(input.tags === undefined ? {} : { tags: input.tags }),
        },
      };
    },
    describe: () => ({
      requiredFields: ['id', 'title'],
      optionalFields: ['tags'],
      redactedFields: ['secret'],
    }),
  });
}

function isArticleInput(input: unknown): input is Article {
  return isRecord(input)
    && typeof input['id'] === 'string'
    && typeof input['title'] === 'string'
    && (input['tags'] === undefined || isStringArray(input['tags']));
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
