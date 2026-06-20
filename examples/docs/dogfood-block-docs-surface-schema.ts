import { defineBlockSchemaAdapter, defineSchemaBlock } from '@flyingrobots/bijou';
import type { BlockSchemaAdapter, SchemaBoundBlockDefinition } from '@flyingrobots/bijou';
import { dogfoodDocsSurfaceBlock } from './dogfood-block-docs-surface.js';
import { parseDogfoodDocsSurfaceSchemaData } from './dogfood-block-docs-surface-parser.js';
import { dogfoodDocsSurfaceFacts } from './dogfood-block-docs-surface-render.js';
import type {
  DogfoodDocsSurfaceBlockConfig,
  DogfoodDocsSurfaceSchemaData,
} from './dogfood-block-docs-surface-types.js';
import { schemaError } from './dogfood-block-schema-utils.js';

export const dogfoodDocsSurfaceSchemaAdapter: BlockSchemaAdapter<DogfoodDocsSurfaceSchemaData> =
  defineBlockSchemaAdapter({
    id: 'dogfood-docs-surface.schema',
    parse(input) {
      const data = parseDogfoodDocsSurfaceSchemaData(input);
      if (data === undefined) {
        return schemaError(
          'dogfood.docsSurface.invalid',
          'DOGFOOD docs surface data is required.',
        );
      }

      return {
        ok: true,
        data,
      };
    },
    describe: () => ({
      requiredFields: ['docsTree', 'selectedRoute', 'selectedHeadingId', 'searchState', 'proofArtifacts'],
      optionalFields: ['selectedRouteLabel'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'DogfoodDocsSurfaceBlock' }],
    }),
  });

export const dogfoodDocsSurfaceSchemaBlock:
  SchemaBoundBlockDefinition<DogfoodDocsSurfaceSchemaData, DogfoodDocsSurfaceBlockConfig, string> =
  defineSchemaBlock<DogfoodDocsSurfaceSchemaData, DogfoodDocsSurfaceBlockConfig, string>({
    block: dogfoodDocsSurfaceBlock,
    schema: dogfoodDocsSurfaceSchemaAdapter,
    bind: (data) => ({
      input: {
        config: {
          docsTree: data.docsTree,
          selectedRoute: data.selectedRoute,
          ...(data.selectedRouteLabel === undefined ? {} : { selectedRouteLabel: data.selectedRouteLabel }),
          selectedHeadingId: data.selectedHeadingId,
          searchState: data.searchState,
          proofArtifacts: data.proofArtifacts,
        },
      },
      facts: dogfoodDocsSurfaceFacts(data),
    }),
  });

export function dogfoodDocsSurfacePreviewOutput(): string {
  return dogfoodDocsSurfaceBlock.render({
    mode: 'static',
    config: {
      docsTree: ['Guides', 'Blocks', 'Packages'],
      selectedRoute: 'blocks',
      selectedHeadingId: 'blocks',
      selectedRouteLabel: 'Blocks',
      searchState: { query: 'table', hitCount: 2 },
      proofArtifacts: [{ id: 'table-demo.gif', label: 'table-demo.gif', available: true }],
    },
  }).output;
}
