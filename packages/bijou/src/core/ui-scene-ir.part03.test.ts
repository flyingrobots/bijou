import { describe, expect, it } from 'vitest';
import { createUiSceneReceipt, lowerUiSceneToSurface, type UiSceneIr } from './ui-scene-ir.js';

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
  it('derives receipt dependency refs from inline token and i18n facts', () => {
      const receipt = createUiSceneReceipt({
        ...fixtureScene,
        tokenUses: [],
        i18nUses: [],
      });
      expect(receipt.i18nKeys).toEqual([
        'dogfood.action.openDoc',
        'dogfood.nav.startHere',
        'dogfood.nav.title',
      ]);
      expect(receipt.tokenRefs).toEqual([
        'semantic.nav.item.active.bg',
        'semantic.nav.item.active.fg',
        'semantic.nav.title.fg',
      ]);
    });

  it('lowers a text-only scene to a Bijou Surface with source-map facts', () => {
      const lowered = lowerUiSceneToSurface(fixtureScene, {
        tokenColors: {
          'semantic.nav.title.fg': '#f7d774',
          'semantic.nav.item.active.fg': '#111827',
          'semantic.nav.item.active.bg': '#a7c7ff',
        },
      });
      expect(lowered.surface.width).toBe(32);
      expect(lowered.surface.height).toBe(4);
      expect(lowered.surface.get(0, 0)).toMatchObject({ char: 'G', fg: '#f7d774', empty: false });
      expect(lowered.surface.get(2, 2)).toMatchObject({
        char: 'S',
        fg: '#111827',
        bg: '#a7c7ff',
        empty: false,
      });
      expect(lowered.cellSourceMap.find((entry) => entry.nodeId === 'nav.start')).toMatchObject({
        nodeId: 'nav.start',
        x: 2,
        y: 2,
        width: 10,
        height: 1,
        source: 'fixture.graphql:13:3',
        textKey: 'dogfood.nav.startHere',
        fgToken: 'semantic.nav.item.active.fg',
        bgToken: 'semantic.nav.item.active.bg',
      });
      expect(lowered.surfaceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    });
});
