import { describe, expect, it } from 'vitest';
import { hashUiSceneValue, stableUiSceneStringify, validateUiSceneIr, type UiSceneIr } from './ui-scene-ir.js';

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
  it('serializes and hashes deterministic scene data', () => {
      const withDifferentObjectKeyOrder = {
        b: 2,
        a: {
          d: 4,
          c: 3,
        },
      };
      expect(stableUiSceneStringify(withDifferentObjectKeyOrder)).toBe('{"a":{"c":3,"d":4},"b":2}');
      expect(stableUiSceneStringify({ a: 1, Z: 2, _: 3 })).toBe('{"Z":2,"_":3,"a":1}');
      expect(hashUiSceneValue({ a: 1 })).toBe(
        'sha256:015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862',
      );
      expect(hashUiSceneValue(fixtureScene)).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(hashUiSceneValue(fixtureScene)).toBe(hashUiSceneValue(JSON.parse(stableUiSceneStringify(fixtureScene))));
      expect(() => stableUiSceneStringify(undefined)).toThrow(
        'ui-scene-ir/1 JSON value cannot be top-level undefined',
      );
      expect(() => hashUiSceneValue(undefined)).toThrow(
        'ui-scene-ir/1 JSON value cannot be top-level undefined',
      );
    });

  it('validates node, action, binding, token, i18n, and root references', () => {
      expect(validateUiSceneIr(fixtureScene)).toEqual({ ok: true, issues: [] });
      const broken: UiSceneIr = {
        ...fixtureScene,
        rootNodeId: 'missing-root',
        nodes: [
          ...fixtureScene.nodes,
          {
            id: 'nav.start',
            kind: 'text',
            parentId: 'missing-parent',
            actions: ['missing-action'],
          },
        ],
        bindings: [
          ...fixtureScene.bindings,
          {
            id: 'bad-binding',
            targetNodeId: 'missing-node',
            targetProperty: 'text',
            source: { kind: 'state', path: 'missing' },
          },
        ],
        tokenUses: [...fixtureScene.tokenUses, { nodeId: 'missing-token-node', slot: 'fg', token: 'semantic.missing' }],
        i18nUses: [...fixtureScene.i18nUses, { nodeId: 'missing-i18n-node', key: 'missing.key' }],
      };
      expect(validateUiSceneIr(broken).issues.map((issue) => issue.code)).toEqual([
        'root-node-missing',
        'duplicate-node-id',
        'parent-node-missing',
        'node-action-missing',
        'binding-target-missing',
        'token-node-missing',
        'i18n-node-missing',
      ]);
    });
});
