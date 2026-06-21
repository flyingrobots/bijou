import { describe, expect, it } from 'vitest';
import { compileGraphqlBijouBlock } from '@flyingrobots/bijou';
import { defaultDogfoodBlockRegistry, navigationListBlock } from '../../../examples/docs/dogfood-blocks.js';
import { existsRepoPath, readRepoFile } from '../repo.js';

const FIXTURE_PATH = 'examples/docs/fixtures/graphql/navigation-list.graphql';

describe('DX-046 GraphQL-authored DOGFOOD navigation fixture', () => {
  it('checks in a real NavigationListBlock GraphQL fixture', () => {
      expect(existsRepoPath(FIXTURE_PATH)).toBe(true);

      const source = readRepoFile(FIXTURE_PATH);
      const artifact = compileGraphqlBijouBlock(source, { sourceName: FIXTURE_PATH });
      const registryEntry = defaultDogfoodBlockRegistry.forSurface('docs.navigation');

      expect(registryEntry?.block).toBe(navigationListBlock);
      expect(registryEntry?.block.metadata.blockName).toBe('NavigationListBlock');
      expect(artifact).toMatchObject({
        artifactVersion: 'bijou-block/1',
        id: 'dogfood.navigation',
        component: 'NavigationListBlock',
        sourceTypeName: 'DogfoodNavigationList',
        sourceName: FIXTURE_PATH,
        rootNodeId: 'dogfood.navigation.root',
        groups: [
          {
            id: 'dogfood.navigation.header',
            label: 'Header',
            source: `${FIXTURE_PATH}#type.DogfoodNavigationList.group.dogfood.navigation.header`,
          },
          {
            id: 'dogfood.navigation.items',
            label: 'Items',
            source: `${FIXTURE_PATH}#type.DogfoodNavigationList.group.dogfood.navigation.items`,
          },
        ],
        targetProfiles: [{ kind: 'bijou-terminal', cols: 80, rows: 8 }],
      });
      expect(artifact.fields.map((field) => field.nodeId)).toEqual([
        'dogfood.navigation.title',
        'dogfood.navigation.active',
        'dogfood.navigation.itemCount',
        'dogfood.navigation.expandHint',
      ]);
      expect(artifact.fields.map((field) => field.text.kind === 'i18n' ? field.text.key : 'literal')).toEqual([
        'dogfood.navigation.title',
        'dogfood.navigation.active',
        'dogfood.navigation.itemCount',
        'dogfood.navigation.expandHint',
      ]);
      expect(artifact.fields.flatMap((field) => field.action == null ? [] : [field.action.id])).toEqual([
        'navigation.selectItem',
        'navigation.expandGroup',
      ]);
      expect(artifact.fields.flatMap((field) => field.binding == null ? [] : [field.binding.id])).toEqual([
        'navigation.selection.activeLabel',
        'navigation.items.count',
      ]);
    });
});
