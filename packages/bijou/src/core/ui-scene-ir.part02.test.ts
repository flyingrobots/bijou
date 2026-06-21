import { describe, expect, it } from 'vitest';
import { createUiSceneReceipt, hashUiSceneValue, validateUiSceneIr, type UiSceneIr, type UiTargetProfile } from './ui-scene-ir.js';

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
  it('validates duplicate action and binding ids', () => {
      const broken: UiSceneIr = {
        ...fixtureScene,
        actions: [
          ...fixtureScene.actions,
          {
            id: 'dogfood.openDoc',
            command: 'dogfood.openDuplicate',
          },
        ],
        bindings: [
          ...fixtureScene.bindings,
          {
            id: 'docs.currentPage.title',
            targetNodeId: 'nav.start',
            targetProperty: 'text',
            source: { kind: 'state', path: 'docs.currentPage.duplicate' },
          },
        ],
      };
      expect(validateUiSceneIr(broken).issues.map((issue) => issue.code)).toEqual([
        'duplicate-action-id',
        'duplicate-binding-id',
      ]);
    });

  it('validates terminal target profile dimensions', () => {
      const broken: UiSceneIr = {
        ...fixtureScene,
        targetProfiles: [
          { kind: 'bijou-terminal', cols: 0, rows: 4 },
          { kind: 'geordi-browser', width: Number.NaN, height: 360 },
          { kind: 'geordi-packed-bijou-cells', cols: 80, rows: -1 },
        ],
      };
      expect(validateUiSceneIr(broken).issues.map((issue) => issue.code)).toEqual([
        'invalid-target-profile',
        'invalid-target-profile',
        'invalid-target-profile',
      ]);
    });

  it('requires known terminal target profiles to include dimensions at compile time', () => {
      // @ts-expect-error missing cols rows
      const p:UiTargetProfile={kind:'bijou-terminal'};
      void p;
    });

  it('creates a structural receipt from portable scene facts', () => {
      expect(createUiSceneReceipt(fixtureScene)).toEqual({
        receiptVersion: 'ui-scene-receipt/1',
        sceneHash: hashUiSceneValue(fixtureScene),
        sourceHash: 'sha256:source',
        nodeIds: ['nav.start', 'nav.title', 'root'],
        componentIds: [],
        i18nKeys: ['dogfood.action.openDoc', 'dogfood.nav.startHere', 'dogfood.nav.title'],
        tokenRefs: [
          'semantic.nav.item.active.bg',
          'semantic.nav.item.active.fg',
          'semantic.nav.title.fg',
        ],
        actionIds: ['dogfood.openDoc'],
        bindingIds: ['docs.currentPage.title'],
        outputs: {},
      });
    });
});
