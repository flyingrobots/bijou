import { describe, expect, it } from 'vitest';
import { lowerUiSceneToBrowser } from './ui-scene-browser.js';
import { debuggerScene } from './ui-scene-browser.test-support.js';
import {
  hashUiSceneValue,
  lowerUiSceneToSurface,
  type UiSceneLowerMode,
} from './ui-scene-ir.js';
import {
  compareUiSceneLowerings,
  witnessUiSceneParity,
} from './ui-scene-parity.js';
import {
  browserOnly,
  debuggerSceneFindings,
  deepFreeze,
  equal,
  findingFor,
  gaps,
  mismatches,
} from './ui-scene-parity.test-support.js';

describe('ui-scene-ir/1 terminal and browser parity witness', () => {
  it('witnesses the debugger fixture with exact findings', () => {
    expect(witnessUiSceneParity(debuggerScene)).toEqual({
      witnessVersion: 'ui-scene-parity/1',
      status: 'compared',
      sceneHash: hashUiSceneValue(debuggerScene),
      surfaceHash: lowerUiSceneToSurface(debuggerScene).surfaceHash,
      markupHash: lowerUiSceneToBrowser(debuggerScene).markupHash,
      findings: debuggerSceneFindings,
    });
  });

  it('gives the same witness for the same scene every time', () => {
    const first = witnessUiSceneParity(debuggerScene);
    const second = witnessUiSceneParity(structuredClone(debuggerScene));
    expect(second).toEqual(first);
    expect(hashUiSceneValue(second)).toBe(hashUiSceneValue(first));
  });

  it('compares both lowerings of one frozen scene and needs no other input', () => {
    const scene = deepFreeze(structuredClone(debuggerScene));
    const witness = witnessUiSceneParity(scene);
    const terminal = lowerUiSceneToSurface(scene);
    const browser = lowerUiSceneToBrowser(scene);
    expect(terminal.sceneHash).toBe(browser.sceneHash);
    expect(compareUiSceneLowerings(terminal, browser)).toEqual(witness);
    expect(mismatches(witness)).toEqual([]);
  });

  it('refuses to compare lowerings of different scenes', () => {
    const other = { ...debuggerScene, id: 'fixture.other-scene' };
    expect(() =>
      compareUiSceneLowerings(
        lowerUiSceneToSurface(debuggerScene),
        lowerUiSceneToBrowser(other),
      ),
    ).toThrow('Cannot compare lowerings of different ui-scene-ir/1 scenes.');
  });

  it('agrees on the colors both targets resolve from one token table', () => {
    const witness = witnessUiSceneParity(debuggerScene, {
      tokenColors: {
        'semantic.title.fg': '#f7d774',
        'semantic.action.fg': '#111827',
        'semantic.action.bg': '#a7c7ff',
      },
    });
    expect(mismatches(witness)).toEqual([]);
    expect(findingFor(witness, 'debugger.title', 'fg-color')).toEqual(
      equal('debugger.title', 'fg-color', '#f7d774'),
    );
    expect(findingFor(witness, 'debugger.step', 'fg-color')).toEqual(
      equal('debugger.step', 'fg-color', '#111827'),
    );
    expect(findingFor(witness, 'debugger.step', 'bg-color')).toEqual(
      equal('debugger.step', 'bg-color', '#a7c7ff'),
    );
    expect(findingFor(witness, 'debugger.tick', 'fg-color')).toBeUndefined();
  });

  it('agrees on the text of every inspection mode', () => {
    const texts: readonly (readonly [UiSceneLowerMode, string])[] = [
      ['normal', 'Debugger'],
      ['node-ids', 'debugger.title'],
      ['i18n-keys', 'debugger.title'],
      ['token-refs', 'semantic.title.fg'],
    ];
    for (const [lowerMode, text] of texts) {
      const witness = witnessUiSceneParity(debuggerScene, { lowerMode });
      expect(mismatches(witness)).toEqual([]);
      expect(findingFor(witness, 'debugger.title', 'text')).toEqual(
        equal('debugger.title', 'text', text),
      );
    }
  });

  it('names the gap when an inspection mode outgrows the terminal', () => {
    const witness = witnessUiSceneParity(debuggerScene, {
      lowerMode: 'token-refs',
    });
    expect(findingFor(witness, 'debugger.step', 'text')).toEqual({
      nodeId: 'debugger.step',
      fact: 'text',
      status: 'gap',
      gap: 'text-clipped',
      terminal: 'semantic.action.fg semantic.ac',
      browser: 'semantic.action.fg semantic.action.bg',
    });
    expect(gaps(witness)).toContain('text-clipped');
    expect(findingFor(witness, 'debugger.step', 'action')).toEqual(
      browserOnly('debugger.step', 'action', 'debugger.step'),
    );
  });
});
