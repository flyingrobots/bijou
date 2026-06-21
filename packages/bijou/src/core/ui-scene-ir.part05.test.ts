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
  it('records source-map facts only for visible rendered cells', () => {
      const lowered = lowerUiSceneToSurface({
        ...fixtureScene,
        nodes: [
          {
            ...must(fixtureScene.nodes[0]),
            children: ['partial', 'offscreen'],
          },
          {
            id: 'partial',
            kind: 'text',
            parentId: 'root',
            layout: { x: 30, y: 0 },
            text: { kind: 'literal', value: 'abcd' },
          },
          {
            id: 'offscreen',
            kind: 'text',
            parentId: 'root',
            layout: { x: 40, y: 0 },
            text: { kind: 'literal', value: 'hidden' },
          },
        ],
        bindings: [],
        actions: [],
        tokenUses: [],
        i18nUses: [],
        sourceMap: [],
      });
      expect(lowered.surface.get(30, 0).char).toBe('a');
      expect(lowered.surface.get(31, 0).char).toBe('b');
      expect(lowered.cellSourceMap).toEqual([
        {
          nodeId: 'partial',
          x: 30,
          y: 0,
          width: 2,
          height: 1,
        },
      ]);
    });
});
