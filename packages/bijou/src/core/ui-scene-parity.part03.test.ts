import { describe, expect, it } from 'vitest';
import {
  debuggerScene,
  withNode,
} from './ui-scene-browser.test-support.js';
import { witnessUiSceneParity } from './ui-scene-parity.js';
import {
  browserOnly,
  equal,
  findingFor,
  mismatches,
} from './ui-scene-parity.test-support.js';

const TICK = 'Tick 12 <paused> & "held"';

describe('ui-scene-ir/1 parity witness named gaps', () => {
  it('names text that the terminal clips at its right edge', () => {
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', { layout: { x: 20, y: 1 } }),
    );
    expect(findingFor(witness, 'debugger.tick', 'text')).toEqual({
      nodeId: 'debugger.tick',
      fact: 'text',
      status: 'gap',
      gap: 'text-clipped',
      terminal: 'Tick 12 <pau',
      browser: TICK,
    });
    expect(mismatches(witness)).toEqual([]);
  });

  it('names text that starts left of the terminal target', () => {
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', { layout: { x: -5, y: 1 } }),
    );
    expect(findingFor(witness, 'debugger.tick', 'x')).toEqual({
      nodeId: 'debugger.tick',
      fact: 'x',
      status: 'gap',
      gap: 'coordinate-normalized',
      terminal: '0',
      browser: '-5',
    });
    expect(findingFor(witness, 'debugger.tick', 'text')).toMatchObject({
      gap: 'text-clipped',
      terminal: '12 <paused> & "held"',
    });
    expect(mismatches(witness)).toEqual([]);
  });

  it('names a text node that the terminal target does not show', () => {
    const outside = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', { layout: { x: 0, y: 9 } }),
    );
    const empty = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', {
        text: { kind: 'literal', value: '' },
      }),
    );
    for (const witness of [outside, empty]) {
      expect(findingFor(witness, 'debugger.tick', 'node')).toEqual({
        nodeId: 'debugger.tick',
        fact: 'node',
        status: 'gap',
        gap: 'text-not-visible',
        browser: 'text',
      });
      expect(findingFor(witness, 'debugger.tick', 'text')).toBeUndefined();
      expect(findingFor(witness, 'debugger.tick', 'binding')).toEqual(
        browserOnly('debugger.tick', 'binding', 'debugger.tick.value'),
      );
      expect(mismatches(witness)).toEqual([]);
    }
  });

  it('names a coordinate that the terminal truncates or defaults', () => {
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', { layout: { y: 1.5 } }),
    );
    expect(findingFor(witness, 'debugger.tick', 'x')).toEqual({
      nodeId: 'debugger.tick',
      fact: 'x',
      status: 'gap',
      gap: 'coordinate-normalized',
      terminal: '0',
    });
    expect(findingFor(witness, 'debugger.tick', 'y')).toEqual({
      nodeId: 'debugger.tick',
      fact: 'y',
      status: 'gap',
      gap: 'coordinate-normalized',
      terminal: '1',
      browser: '1.5',
    });
    expect(findingFor(witness, 'debugger.tick', 'text')).toEqual(
      equal('debugger.tick', 'text', TICK),
    );
    expect(mismatches(witness)).toEqual([]);
  });

  it('names text that a later node draws over in the terminal', () => {
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.step', { layout: { x: 0, y: 1 } }),
    );
    expect(findingFor(witness, 'debugger.tick', 'text')).toEqual({
      nodeId: 'debugger.tick',
      fact: 'text',
      status: 'gap',
      gap: 'text-overdrawn',
      terminal: 'Step 12 <paused> & "held"',
      browser: TICK,
    });
    expect(findingFor(witness, 'debugger.step', 'text')).toEqual(
      equal('debugger.step', 'text', 'Step'),
    );
    expect(mismatches(witness)).toEqual([]);
  });

  it('names text that the terminal sanitizes', () => {
    const raw = 'Tick\u001b[31m 12\tpaused';
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.tick', {
        text: { kind: 'literal', value: raw },
      }),
    );
    const finding = findingFor(witness, 'debugger.tick', 'text');
    expect(finding).toMatchObject({
      status: 'gap',
      gap: 'text-sanitized',
      browser: raw,
    });
    expect(finding?.terminal).not.toContain('\u001b');
    expect(finding?.terminal).not.toContain('\t');
    expect(mismatches(witness)).toEqual([]);
  });

  it('names a border token that only the browser output carries', () => {
    const witness = witnessUiSceneParity(
      withNode(debuggerScene, 'debugger.step', {
        style: { border: { token: 'semantic.action.border' } },
      }),
    );
    expect(findingFor(witness, 'debugger.step', 'border-token')).toEqual(
      browserOnly('debugger.step', 'border-token', 'semantic.action.border'),
    );
    expect(mismatches(witness)).toEqual([]);
  });
});
