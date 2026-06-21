import { describe, expect, it } from 'vitest';
import { createUiSceneTerminalReceipt, hashUiSceneValue, lowerUiSceneToTerminalProof, lowerUiSceneToSurface, type UiSceneIr } from './ui-scene-ir.js';
import { must } from '@flyingrobots/bijou/adapters/test';

const fixtureScene: UiSceneIr = {
  irVersion: 'ui-scene-ir/1',
  id: 'dogfood.start-pane',
  sourceHash: 'sha256:source',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      kind: 'group',
      children: ['nav.title', 'nav.start'],
      layout: { x: 0, y: 0, width: 32, height: 3 },
    },
    {
      id: 'nav.title',
      kind: 'text',
      parentId: 'root',
      layout: { x: 0, y: 0 },
      text: { kind: 'i18n', key: 'dogfood.nav.title', fallback: 'Guides' },
      style: { fg: { token: 'semantic.nav.title.fg' } },
    },
    {
      id: 'nav.start',
      kind: 'text',
      parentId: 'root',
      layout: { x: 2, y: 2 },
      text: { kind: 'i18n', key: 'dogfood.nav.startHere', fallback: 'Start Here' },
      style: {
        fg: { token: 'semantic.nav.item.active.fg' },
        bg: { token: 'semantic.nav.item.active.bg' },
      },
      actions: ['dogfood.openDoc'],
    },
  ],
  bindings: [
    {
      id: 'docs.currentPage.title',
      targetNodeId: 'nav.title',
      targetProperty: 'text',
      source: { kind: 'state', path: 'docs.currentPage.title' },
    },
  ],
  actions: [
    {
      id: 'dogfood.openDoc',
      command: 'dogfood.openDoc',
      keybindings: ['Enter'],
      targetNodeId: 'nav.start',
      label: { kind: 'i18n', key: 'dogfood.action.openDoc', fallback: 'Open' },
    },
  ],
  tokenUses: [
    { nodeId: 'nav.title', slot: 'fg', token: 'semantic.nav.title.fg' },
    { nodeId: 'nav.start', slot: 'fg', token: 'semantic.nav.item.active.fg' },
    { nodeId: 'nav.start', slot: 'bg', token: 'semantic.nav.item.active.bg' },
  ],
  i18nUses: [
    { nodeId: 'nav.title', key: 'dogfood.nav.title' },
    { nodeId: 'nav.start', key: 'dogfood.nav.startHere' },
    { actionId: 'dogfood.openDoc', key: 'dogfood.action.openDoc' },
  ],
  sourceMap: [
    { nodeId: 'nav.title', source: 'fixture.graphql:8:3' },
    { nodeId: 'nav.start', source: 'fixture.graphql:13:3' },
  ],
  targetProfiles: [
    { kind: 'bijou-terminal', cols: 32, rows: 4, claims: ['cell output', 'source-map facts'] },
    { kind: 'geordi-browser', width: 640, height: 360, claims: ['structural receipt'] },
  ],
  portability: { level: 'portable' },
};

describe('ui-scene-ir/1', () => {
  it('clips negative text layouts without shifting hidden graphemes on screen', () => {
      const lowered = lowerUiSceneToSurface({
        ...fixtureScene,
        nodes: [
          {
            ...must(fixtureScene.nodes[0]),
            children: ['partial'],
          },
          {
            id: 'partial',
            kind: 'text',
            parentId: 'root',
            layout: { x: -2, y: 0 },
            text: { kind: 'literal', value: 'abcd' },
          },
        ],
        bindings: [],
        actions: [],
        tokenUses: [],
        i18nUses: [],
        sourceMap: [],
      });
      expect(lowered.surface.get(0, 0).char).toBe('c');
      expect(lowered.surface.get(1, 0).char).toBe('d');
      expect(lowered.cellSourceMap).toEqual([
        {
          nodeId: 'partial',
          x: 0,
          y: 0,
          width: 2,
          height: 1,
        },
      ]);
    });

  it('creates a terminal receipt from lowered Surface output', () => {
      const proof = lowerUiSceneToTerminalProof(fixtureScene, {
        tokenColors: {
          'semantic.nav.title.fg': '#f7d774',
          'semantic.nav.item.active.fg': '#111827',
          'semantic.nav.item.active.bg': '#a7c7ff',
        },
      });
      const directReceipt = createUiSceneTerminalReceipt(fixtureScene, proof.lowering);
      expect(proof.lowering.sceneHash).toBe(hashUiSceneValue(fixtureScene));
      expect(proof.receipt).toEqual(directReceipt);
      expect(proof.receipt.outputs.terminal).toEqual({
        layoutHash: hashUiSceneValue({
          cellSourceMap: proof.lowering.cellSourceMap,
          targetProfile: proof.lowering.targetProfile,
        }),
        surfaceHash: proof.lowering.surfaceHash,
      });
      const unrelatedLowering = lowerUiSceneToSurface({
        ...fixtureScene,
        id: 'other.scene',
      });
      expect(() => createUiSceneTerminalReceipt(fixtureScene, unrelatedLowering)).toThrow(
        'Terminal lowering was created for a different ui-scene-ir/1 scene.',
      );
    });
});
