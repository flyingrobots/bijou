import { describe, expect, it } from 'vitest';
import { lowerUiSceneToBrowser } from './ui-scene-browser.js';
import {
  debuggerScene,
  withNode,
} from './ui-scene-browser.test-support.js';
import type { UiSceneIr } from './ui-scene-ir.js';

describe('ui-scene-ir/1 browser seam refusals', () => {
  it('refuses an invalid scene before lowering it', () => {
    expect(() =>
      lowerUiSceneToBrowser({ ...debuggerScene, rootNodeId: 'missing' }),
    ).toThrow('Invalid ui-scene-ir/1: Root node does not exist: missing');
  });

  it('refuses a scene without a geordi-browser target profile', () => {
    expect(() =>
      lowerUiSceneToBrowser({
        ...debuggerScene,
        targetProfiles: [{ kind: 'bijou-terminal', cols: 32, rows: 3 }],
      }),
    ).toThrow(
      'Cannot lower ui-scene-ir/1 without a geordi-browser target profile.',
    );
  });

  it('refuses a target requirement it does not support', () => {
    const scene: UiSceneIr = {
      ...debuggerScene,
      targetProfiles: [
        {
          kind: 'geordi-browser',
          width: 640,
          height: 360,
          requires: ['ui-scene/core/1', 'ui-scene/markdown/1'],
        },
      ],
    };
    expect(() => lowerUiSceneToBrowser(scene)).toThrow(
      'Unsupported ui-scene-ir/1 requirement for geordi-browser: ui-scene/markdown/1',
    );
    expect(() =>
      lowerUiSceneToBrowser(scene, {
        supportedRequirements: ['ui-scene/core/1', 'ui-scene/markdown/1'],
      }),
    ).not.toThrow();
  });

  it('refuses a node kind it cannot lower', () => {
    expect(() =>
      lowerUiSceneToBrowser(
        withNode(debuggerScene, 'debugger.tick', { kind: 'table' }),
      ),
    ).toThrow(
      'Cannot lower ui-scene-ir/1 node debugger.tick (table) to a geordi-browser element.',
    );
  });

  it('refuses a node that the tree places twice', () => {
    expect(() =>
      lowerUiSceneToBrowser(
        withNode(debuggerScene, 'debugger.step', { children: ['debugger'] }),
      ),
    ).toThrow(
      'Cannot lower ui-scene-ir/1 node debugger to geordi-browser: the tree places it more than once.',
    );
  });

  it('refuses a node that the root does not reach', () => {
    expect(() =>
      lowerUiSceneToBrowser(
        withNode(debuggerScene, 'debugger', {
          children: ['debugger.title', 'debugger.step'],
        }),
      ),
    ).toThrow(
      'Cannot lower ui-scene-ir/1 node debugger.tick to geordi-browser: the root node does not reach it.',
    );
  });

  it('refuses a token color that is not a hex color', () => {
    expect(() =>
      lowerUiSceneToBrowser(debuggerScene, {
        tokenColors: { 'semantic.action.fg': 'red;position:fixed' },
      }),
    ).toThrow(
      'Cannot lower ui-scene-ir/1 token semantic.action.fg to geordi-browser: red;position:fixed is not a hex color.',
    );
  });

  it('refuses an action id that a token list cannot carry', () => {
    const scene: UiSceneIr = {
      ...withNode(debuggerScene, 'debugger.step', { actions: ['step now'] }),
      actions: [{ id: 'step now', command: 'debugger.step' }],
    };
    expect(() => lowerUiSceneToBrowser(scene)).toThrow(
      'Cannot lower ui-scene-ir/1 node debugger.step to geordi-browser: data-bijou-action value "step now" contains whitespace.',
    );
  });

  it('omits a layout number that is not finite', () => {
    const lowered = lowerUiSceneToBrowser(
      withNode(debuggerScene, 'debugger.tick', {
        layout: { x: Number.NaN, y: 1.5, width: Number.POSITIVE_INFINITY },
      }),
    );
    expect(lowered.markup).toContain(
      'data-bijou-source="fixture.debugger:3:1" style="--bijou-y:1.5">',
    );
  });

  it('escapes attribute values and keeps an empty scene well formed', () => {
    const lowered = lowerUiSceneToBrowser({
      ...debuggerScene,
      id: 'a"b<c>&d',
      rootNodeId: 'only',
      nodes: [{ id: 'only', kind: 'group' }],
      bindings: [],
      actions: [],
      tokenUses: [],
      i18nUses: [],
      sourceMap: [],
    });
    expect(lowered.markup).toContain(
      'data-bijou-scene-id="a&quot;b&lt;c&gt;&amp;d"',
    );
    expect(lowered.markup).toContain(
      '<div data-bijou-node-id="only" data-bijou-node-kind="group"></div></div>',
    );
  });
});
