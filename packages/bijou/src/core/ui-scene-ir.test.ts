import { describe, expect, it } from 'vitest';
import {
  createUiSceneTerminalReceipt,
  createUiSceneReceipt,
  hashUiSceneValue,
  lowerUiSceneToTerminalProof,
  lowerUiSceneToSurface,
  stableUiSceneStringify,
  validateUiSceneIr,
  type UiSceneIr,
  type UiTargetProfile,
} from './ui-scene-ir.js';

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
    expect(hashUiSceneValue(fixtureScene)).toMatch(/^fnv1a32:[0-9a-f]{8}$/);
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
    // @ts-expect-error Known terminal targets must include cols and rows.
    const invalidKnownProfile: UiTargetProfile = { kind: 'bijou-terminal' };
    expect(invalidKnownProfile.kind).toBe('bijou-terminal');
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
    expect(lowered.surfaceHash).toMatch(/^fnv1a32:[0-9a-f]{8}$/);
  });

  it('hashes actual rendered Surface cell state', () => {
    const one = lowerUiSceneToSurface({
      ...fixtureScene,
      nodes: [
        {
          ...fixtureScene.nodes[0]!,
          children: ['text'],
        },
        {
          ...fixtureScene.nodes[1]!,
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
          ...fixtureScene.nodes[0]!,
          children: ['text'],
        },
        {
          ...fixtureScene.nodes[1]!,
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

  it('records source-map facts only for visible rendered cells', () => {
    const lowered = lowerUiSceneToSurface({
      ...fixtureScene,
      nodes: [
        {
          ...fixtureScene.nodes[0]!,
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

function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}
