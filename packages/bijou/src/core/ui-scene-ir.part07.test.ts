import { describe, expect, it } from 'vitest';
import { lowerUiSceneToSurface, type UiSceneIr } from './ui-scene-ir.js';

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

function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}

describe('ui-scene-ir/1', () => {
  it('renders deterministic lower modes for agent inspection', () => {
      const nodeMode = lowerUiSceneToSurface(fixtureScene, { lowerMode: 'node-ids' });
      const i18nMode = lowerUiSceneToSurface(fixtureScene, { lowerMode: 'i18n-keys' });
      const tokenMode = lowerUiSceneToSurface(fixtureScene, { lowerMode: 'token-refs' });
      expect(rowText(nodeMode.surface, 2)).toContain('nav.start');
      expect(rowText(i18nMode.surface, 2)).toContain('dogfood.nav.startHere');
      expect(rowText(tokenMode.surface, 2)).toContain('semantic.nav.item.active.fg');
    });

  it('fails loudly before drawing unsupported target requirements', () => {
      const unsupported: UiSceneIr = {
        ...fixtureScene,
        targetProfiles: [
          {
            kind: 'bijou-terminal',
            cols: 32,
            rows: 4,
            requires: ['ui-scene/core/1', 'ui-scene/markdown/1'],
          },
        ],
      };
      expect(() => lowerUiSceneToSurface(unsupported, {
        supportedRequirements: ['ui-scene/core/1'],
      })).toThrow('Unsupported ui-scene-ir/1 requirement for bijou-terminal: ui-scene/markdown/1');
    });
});
