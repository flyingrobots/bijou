import { describe, expect, it } from 'vitest';
import { bindSchemaBlockInput, isSchemaBoundBlockDefinition, validateBlockMetadata } from '@flyingrobots/bijou';
import { dogfoodDocsSurfaceBlock, dogfoodDocsSurfaceSchemaBlock } from '../../../examples/docs/dogfood-blocks.js';

function dogfoodDocsFixture() {
  return {
    docsTree: ['Guides', 'Blocks', 'Packages'],
    selectedRoute: 'blocks',
    selectedHeadingId: 'blocks',
    selectedRouteLabel: 'Blocks',
    searchState: { query: 'table', hitCount: 2 },
    proofArtifacts: [{
      id: 'table-demo.gif',
      label: 'table-demo.gif',
      available: true,
    }],
  };
}

describe('DF-030 DOGFOOD docs surface Block', () => {
  it('publishes the canonical DOGFOOD docs surface as a schema-bound Block', () => {
      expect(validateBlockMetadata(dogfoodDocsSurfaceBlock.metadata).passed).toBe(true);
      expect(dogfoodDocsSurfaceBlock.metadata.blockName).toBe('DogfoodDocsSurfaceBlock');
      expect(dogfoodDocsSurfaceBlock.metadata.family).toBe('docs-surface');
      expect(dogfoodDocsSurfaceBlock.metadata.scale).toBe('workspace');
      expect(dogfoodDocsSurfaceBlock.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(dogfoodDocsSurfaceBlock.data?.names()).toEqual([
        'docsTree',
        'selectedRoute',
        'searchState',
        'proofArtifacts',
      ]);
      expect(dogfoodDocsSurfaceBlock.commands?.map((intent) => intent.id)).toEqual([
        'docs.navigate',
        'docs.search',
        'docs.openProof',
        'docs.copyLink',
      ]);

      expect(isSchemaBoundBlockDefinition(dogfoodDocsSurfaceSchemaBlock)).toBe(true);
      expect(dogfoodDocsSurfaceSchemaBlock.block).toBe(dogfoodDocsSurfaceBlock);
      expect(dogfoodDocsSurfaceSchemaBlock.schema.describe?.()).toMatchObject({
        requiredFields: ['docsTree', 'selectedRoute', 'selectedHeadingId', 'searchState', 'proofArtifacts'],
        facts: [{ kind: 'entity', key: 'block.schema', value: 'DogfoodDocsSurfaceBlock' }],
      });
    });

  it('validates unknown docs-surface input before binding render config', () => {
      const bound = bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, dogfoodDocsFixture());

      expect(bound).toMatchObject({
        ok: true,
        input: {
          config: {
            docsTree: ['Guides', 'Blocks', 'Packages'],
            selectedRoute: 'blocks',
            selectedHeadingId: 'blocks',
            searchState: { query: 'table', hitCount: 2 },
            proofArtifacts: [{
              id: 'table-demo.gif',
              label: 'table-demo.gif',
              available: true,
            }],
          },
        },
      });
      expect(bound.facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'route', value: 'blocks' },
        { kind: 'entity', key: 'heading-id', value: 'blocks' },
        { kind: 'count', key: 'search-hit-count', value: 2 },
        { kind: 'entity', key: 'proof-artifact', value: 'table-demo.gif' },
      ]));

      expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, {
        selectedRoute: 'blocks',
      })).toMatchObject({
        ok: false,
        issues: [{
          severity: 'error',
          code: 'dogfood.docsSurface.invalid',
        }],
      });
    });

  it('rejects accessor-backed docs-surface input without invoking getters', () => {
      let getterCalls = 0;
      const accessorInput = Object.defineProperties({}, {
        docsTree: {
          enumerable: true,
          get() {
            getterCalls += 1;
            return ['Guides'];
          },
        },
        selectedRoute: {
          enumerable: true,
          get() {
            getterCalls += 1;
            return 'guides';
          },
        },
      });

      expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, accessorInput)).toMatchObject({
        ok: false,
      });
      expect(getterCalls).toBe(0);
    });

  it('rejects accessor-backed docs-surface arrays without invoking nested getters', () => {
      let getterCalls = 0;
      const docsTree = Object.defineProperty([], '0', {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Guides';
        },
      });
      const proofArtifacts = Object.defineProperty([], '0', {
        enumerable: true,
        get() {
          getterCalls += 1;
          return {
            id: 'table-demo.gif',
            label: 'table-demo.gif',
            available: true,
          };
        },
      });

      expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, {
        docsTree,
        selectedRoute: 'blocks',
        selectedHeadingId: 'blocks',
        searchState: { query: 'table', hitCount: 2 },
        proofArtifacts,
      })).toMatchObject({
        ok: false,
      });
      expect(getterCalls).toBe(0);
    });
});
