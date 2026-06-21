import { describe, expect, it } from 'vitest';
import { lowerUiSceneToSurface, type UiSceneIr } from './ui-scene-ir.js';
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
  it('hashes actual rendered Surface cell state', () => {
      const one = lowerUiSceneToSurface({
        ...fixtureScene,
        nodes: [
          {
            ...must(fixtureScene.nodes[0]),
            children: ['text'],
          },
          {
            ...must(fixtureScene.nodes[1]),
            id: 'text',
            parentId: 'root',
            text: { kind: 'literal', value: 'A' },
          },
        ],
        bindings: [],
        actions: [],
        tokenUses: [],
        i18nUses: [],
        sourceMap: [],
      });
      const two = lowerUiSceneToSurface({
        ...fixtureScene,
        nodes: [
          {
            ...must(fixtureScene.nodes[0]),
            children: ['text'],
          },
          {
            ...must(fixtureScene.nodes[1]),
            id: 'text',
            parentId: 'root',
            text: { kind: 'literal', value: 'B' },
          },
        ],
        bindings: [],
        actions: [],
        tokenUses: [],
        i18nUses: [],
        sourceMap: [],
      });
      expect(one.surface.get(0, 0).char).toBe('A');
      expect(two.surface.get(0, 0).char).toBe('B');
      expect(one.surfaceHash).not.toBe(two.surfaceHash);
    });

  it('fails loudly before drawing unsupported visible node kinds', () => {
      const unsupported: UiSceneIr = {
        ...fixtureScene,
        nodes: [
          {
            ...must(fixtureScene.nodes[0]),
            children: ['markdown-doc'],
          },
          {
            id: 'markdown-doc',
            kind: 'markdown',
            parentId: 'root',
            layout: { x: 0, y: 0, width: 12, height: 4 },
            text: { kind: 'literal', value: '# Start' },
          },
        ],
        bindings: [],
        actions: [],
        tokenUses: [],
        i18nUses: [],
        sourceMap: [],
      };
      expect(() => lowerUiSceneToSurface(unsupported)).toThrow(
        'Cannot lower ui-scene-ir/1 node markdown-doc (markdown) to bijou-terminal text Surface.',
      );
    });
});
