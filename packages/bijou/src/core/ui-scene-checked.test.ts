import { describe, expect, it } from 'vitest';
import { lowerUiSceneToBrowser, type UiSceneBrowserElement } from './ui-scene-browser.js';
import { debuggerScene, withNode } from './ui-scene-browser.test-support.js';
import { hashUiSceneValue, stableUiSceneStringify, validateUiSceneIr } from './ui-scene-ir.js';
import { witnessUiSceneParity } from './ui-scene-parity.js';

const step = 'debugger.step';

function checkedOf(root: UiSceneBrowserElement, nodeId: string): string | undefined {
  const found = [root, ...root.children.flatMap(function walk(e): UiSceneBrowserElement[] {
    return [e, ...e.children.flatMap(walk)];
  })].find((e) => e.attributes.some((a) => a.name === 'data-bijou-node-id' && a.value === nodeId));
  return found?.attributes.find((a) => a.name === 'data-bijou-checked')?.value;
}

const toggle = (checked: boolean) =>
  withNode(debuggerScene, step, { role: 'switch', state: { checked } });

describe('ui-scene-ir/1 node state.checked', () => {
  it('lowers a checked and an unchecked switch to data-bijou-checked', () => {
    expect(checkedOf(lowerUiSceneToBrowser(toggle(true)).root, step)).toBe('true');
    expect(checkedOf(lowerUiSceneToBrowser(toggle(false)).root, step)).toBe('false');
  });

  it('lowers nothing for a switch without the state, and keeps its exact markup', () => {
    const plain = withNode(debuggerScene, step, { role: 'switch' });
    expect(checkedOf(lowerUiSceneToBrowser(plain).root, step)).toBeUndefined();
    expect(lowerUiSceneToBrowser(plain).markup).not.toContain('data-bijou-checked');
  });

  it('lowers the declared state of a node that is not a switch as a fact only', () => {
    const scene = withNode(debuggerScene, step, { state: { checked: true } });
    expect(checkedOf(lowerUiSceneToBrowser(scene).root, step)).toBe('true');
  });

  it('keeps the canonical bytes and hash of a scene that declares no state', () => {
    expect(stableUiSceneStringify(debuggerScene)).not.toContain('"state":{');
    expect(hashUiSceneValue(debuggerScene)).toBe(lowerUiSceneToBrowser(debuggerScene).sceneHash);
  });

  it('hashes a scene that declares the state differently from one that does not', () => {
    expect(hashUiSceneValue(toggle(true))).not.toBe(hashUiSceneValue(debuggerScene));
    expect(hashUiSceneValue(toggle(true))).not.toBe(hashUiSceneValue(toggle(false)));
  });

  it('validates that checked is a boolean', () => {
    expect(validateUiSceneIr(toggle(true)).ok).toBe(true);
    const bad = withNode(debuggerScene, step, { state: { checked: 'yes' as unknown as boolean } });
    expect(validateUiSceneIr(bad)).toMatchObject({
      ok: false,
      issues: [{ code: 'invalid-node-state', id: step }],
    });
    expect(() => lowerUiSceneToBrowser(bad)).toThrow(/Invalid ui-scene-ir\/1/u);
  });

  it('records the state as a browser-only parity gap', () => {
    const witness = witnessUiSceneParity(toggle(true));
    if (witness.status !== 'compared') throw new Error('expected a comparison');
    expect(witness.findings.filter((f) => f.fact === 'checked')).toEqual([
      { nodeId: step, fact: 'checked', status: 'gap', gap: 'browser-only-fact', browser: 'true' },
    ]);
    expect(witness.findings.some((f) => f.status === 'mismatch')).toBe(false);
  });
});
