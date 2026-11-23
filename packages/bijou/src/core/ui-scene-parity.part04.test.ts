import { describe, expect, it } from 'vitest';
import {
  debuggerScene,
  withNode,
} from './ui-scene-browser.test-support.js';
import { lowerUiSceneToSurface } from './ui-scene-ir.js';
import { witnessUiSceneParity } from './ui-scene-parity.js';
import { mismatches } from './ui-scene-parity.test-support.js';

describe('ui-scene-ir/1 parity witness refusals', () => {
  it('records that only the browser refuses a node the root does not reach', () => {
    const scene = withNode(debuggerScene, 'debugger', {
      children: ['debugger.title', 'debugger.step'],
    });
    expect(witnessUiSceneParity(scene)).toEqual({
      witnessVersion: 'ui-scene-parity/1',
      status: 'refused',
      refusals: [
        {
          target: 'browser',
          message:
            'Cannot lower ui-scene-ir/1 node debugger.tick to geordi-browser: the root node does not reach it.',
        },
      ],
    });
    expect(
      lowerUiSceneToSurface(scene).cellSourceMap.map((entry) => entry.nodeId),
    ).toEqual(['debugger.title', 'debugger.tick', 'debugger.step']);
  });

  it('records that only the browser refuses a node the tree places twice', () => {
    const scene = withNode(debuggerScene, 'debugger.step', {
      children: ['debugger'],
    });
    expect(witnessUiSceneParity(scene)).toMatchObject({
      status: 'refused',
      refusals: [
        {
          target: 'browser',
          message:
            'Cannot lower ui-scene-ir/1 node debugger to geordi-browser: the tree places it more than once.',
        },
      ],
    });
  });

  it('records a missing target profile as a refusal by that target only', () => {
    const [terminalProfile, browserProfile] = debuggerScene.targetProfiles;
    expect(
      witnessUiSceneParity({
        ...debuggerScene,
        targetProfiles: terminalProfile == null ? [] : [terminalProfile],
      }),
    ).toMatchObject({
      status: 'refused',
      refusals: [
        {
          target: 'browser',
          message:
            'Cannot lower ui-scene-ir/1 without a geordi-browser target profile.',
        },
      ],
    });
    expect(
      witnessUiSceneParity({
        ...debuggerScene,
        targetProfiles: browserProfile == null ? [] : [browserProfile],
      }),
    ).toMatchObject({
      status: 'refused',
      refusals: [
        {
          target: 'terminal',
          message:
            'Cannot lower ui-scene-ir/1 without a bijou-terminal target profile.',
        },
      ],
    });
  });

  it('records that only the browser refuses a token color that is not hex', () => {
    expect(
      witnessUiSceneParity(debuggerScene, {
        tokenColors: { 'semantic.action.fg': 'red;position:fixed' },
      }),
    ).toMatchObject({
      status: 'refused',
      refusals: [
        {
          target: 'browser',
          message:
            'Cannot lower ui-scene-ir/1 token semantic.action.fg to geordi-browser: red;position:fixed is not a hex color.',
        },
      ],
    });
  });

  it('records a refusal by both targets for a node kind neither can lower', () => {
    expect(
      witnessUiSceneParity(
        withNode(debuggerScene, 'debugger.tick', { kind: 'image' }),
      ),
    ).toEqual({
      witnessVersion: 'ui-scene-parity/1',
      status: 'refused',
      refusals: [
        {
          target: 'terminal',
          message:
            'Cannot lower ui-scene-ir/1 node debugger.tick (image) to bijou-terminal text Surface.',
        },
        {
          target: 'browser',
          message:
            'Cannot lower ui-scene-ir/1 node debugger.tick (image) to a geordi-browser element.',
        },
      ],
    });
  });

  it('records one refusal message from both targets for an invalid scene', () => {
    const witness = witnessUiSceneParity({
      ...debuggerScene,
      rootNodeId: 'missing',
    });
    expect(witness.status).toBe('refused');
    const refusals = witness.status === 'refused' ? witness.refusals : [];
    expect(refusals.map((refusal) => refusal.target)).toEqual([
      'terminal',
      'browser',
    ]);
    expect(refusals[0]?.message).toMatch(/^Invalid ui-scene-ir\/1: /);
    expect(refusals[1]?.message).toBe(refusals[0]?.message);
  });

  it('resolves no color from an entry the token table only inherits', () => {
    const inherited = Object.create({ 'semantic.action.fg': '#111827' }) as Record<string, string>;
    const scene = withNode(debuggerScene, 'debugger.step', {
      style: { fg: { token: 'constructor' }, bg: { token: 'toString' } },
    });
    for (const [source, tokenColors] of [[debuggerScene, inherited], [scene, {}]] as const) {
      const cell = lowerUiSceneToSurface(source, { tokenColors }).surface.get(2, 2);
      expect([cell.fg, cell.bg]).toEqual([undefined, undefined]);
      expect(mismatches(witnessUiSceneParity(source, { tokenColors }))).toEqual([]);
    }
  });
});
