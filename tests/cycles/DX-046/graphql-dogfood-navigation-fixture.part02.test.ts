import { describe, expect, it } from 'vitest';
import { compileGraphqlBijouBlock, createGraphqlBijouBlockDebugSummary, hashUiSceneValue, lowerBijouBlockToUiScene, lowerUiSceneToTerminalProof, validateUiSceneIr } from '@flyingrobots/bijou';
import { readRepoFile } from '../repo.js';

const FIXTURE_PATH = 'examples/docs/fixtures/graphql/navigation-list.graphql';

const NAV_TOKEN_COLORS = {
  'semantic.nav.hint.fg': '#8aa4ff',
  'semantic.nav.item.active.bg': '#1f2937',
  'semantic.nav.item.active.fg': '#f9fafb',
  'semantic.nav.item.fg': '#d1d5db',
  'semantic.nav.title.fg': '#f7d774',
};

function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}

describe('DX-046 GraphQL-authored DOGFOOD navigation fixture', () => {
  it('lowers the DOGFOOD navigation fixture to terminal proof and debug facts', () => {
      const source = readRepoFile(FIXTURE_PATH);
      const artifact = compileGraphqlBijouBlock(source, { sourceName: FIXTURE_PATH });
      const scene = lowerBijouBlockToUiScene(artifact);

      expect(validateUiSceneIr(scene)).toEqual({ ok: true, issues: [] });
      expect(scene.nodes.map((node) => node.id)).toEqual([
        'dogfood.navigation.root',
        'dogfood.navigation.header',
        'dogfood.navigation.items',
        'dogfood.navigation.title',
        'dogfood.navigation.active',
        'dogfood.navigation.itemCount',
        'dogfood.navigation.expandHint',
      ]);

      const proof = lowerUiSceneToTerminalProof(scene, { tokenColors: NAV_TOKEN_COLORS });
      expect(rowText(proof.lowering.surface, 0)).toContain('Documentation');
      expect(rowText(proof.lowering.surface, 2)).toContain('Active: Blocks');
      expect(rowText(proof.lowering.surface, 3)).toContain('Items: 7');
      expect(rowText(proof.lowering.surface, 4)).toContain('Expand group');
      expect(proof.lowering.cellSourceMap.find((entry) => entry.nodeId === 'dogfood.navigation.active'))
        .toMatchObject({
          nodeId: 'dogfood.navigation.active',
          source: `${FIXTURE_PATH}#type.DogfoodNavigationList.field.activeItem`,
          textKey: 'dogfood.navigation.active',
          fgToken: 'semantic.nav.item.active.fg',
          bgToken: 'semantic.nav.item.active.bg',
        });
      expect(proof.receipt.sceneHash).toBe(hashUiSceneValue(scene));
      expect(proof.receipt.actionIds).toEqual(['navigation.expandGroup', 'navigation.selectItem']);
      expect(proof.receipt.bindingIds).toEqual([
        'navigation.items.count',
        'navigation.selection.activeLabel',
      ]);

      const summary = createGraphqlBijouBlockDebugSummary(artifact, { tokenColors: NAV_TOKEN_COLORS });
      expect(summary).toMatchObject({
        summaryVersion: 'graphql-bijou-block-debug/1',
        artifactId: 'dogfood.navigation',
        artifactHash: hashUiSceneValue(artifact),
        sceneHash: hashUiSceneValue(scene),
        rootNodeId: 'dogfood.navigation.root',
        actionIds: ['navigation.expandGroup', 'navigation.selectItem'],
        bindingIds: ['navigation.items.count', 'navigation.selection.activeLabel'],
        i18nKeys: [
          'dogfood.navigation.active',
          'dogfood.navigation.expandHint',
          'dogfood.navigation.itemCount',
          'dogfood.navigation.title',
        ],
        tokenRefs: [
          'semantic.nav.hint.fg',
          'semantic.nav.item.active.bg',
          'semantic.nav.item.active.fg',
          'semantic.nav.item.fg',
          'semantic.nav.title.fg',
        ],
      });
      expect(summary.summaryHash).toBe(hashUiSceneValue({ ...summary, summaryHash: undefined }));
      expect(summary.groups.map((group) => [group.id, group.childNodeIds])).toEqual([
        ['dogfood.navigation.header', ['dogfood.navigation.title']],
        [
          'dogfood.navigation.items',
          [
            'dogfood.navigation.active',
            'dogfood.navigation.itemCount',
            'dogfood.navigation.expandHint',
          ],
        ],
      ]);
      expect(summary.lowerModes.map((mode) => mode.mode)).toEqual([
        'normal',
        'node-ids',
        'i18n-keys',
        'token-refs',
      ]);
      expect(summary.lowerModes.find((mode) => mode.mode === 'node-ids')?.rows.join('\n'))
        .toContain('dogfood.navigation.active');
      expect(summary.lowerModes.find((mode) => mode.mode === 'i18n-keys')?.rows.join('\n'))
        .toContain('dogfood.navigation.active');
      expect(summary.lowerModes.find((mode) => mode.mode === 'token-refs')?.rows.join('\n'))
        .toContain('semantic.nav.item.active.fg semantic.nav.item.active.bg');
    });

  it('rejects malformed DOGFOOD navigation fixture facts before terminal proof', () => {
      const source = readRepoFile(FIXTURE_PATH);

      expect(() => compileGraphqlBijouBlock(
        source.replace(
          '\n    @bijouI18n(key: "dogfood.navigation.itemCount", fallback: "Items: 7")',
          '',
        ),
        { sourceName: FIXTURE_PATH },
      )).toThrow('GraphQL Bijou block field itemCount must include @bijouI18n(...).');

      expect(() => compileGraphqlBijouBlock(
        source.replace(
          '@bijouText(id: "dogfood.navigation.active", group: "dogfood.navigation.items", x: 2, y: 2)',
          '@bijouText(id: "dogfood.navigation.active", group: "dogfood.navigation.missing", x: 2, y: 2)',
        ),
        { sourceName: FIXTURE_PATH },
      )).toThrow('GraphQL Bijou block field activeItem references missing group: dogfood.navigation.missing');
    });
});
