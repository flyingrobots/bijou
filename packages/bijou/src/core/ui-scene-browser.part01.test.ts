import { describe, expect, it } from 'vitest';
import {
  lowerUiSceneToBrowser,
  renderUiSceneBrowserMarkup,
  type UiSceneBrowserElement,
} from './ui-scene-browser.js';
import {
  debuggerScene,
  debuggerSceneMarkup,
} from './ui-scene-browser.test-support.js';
import { hashUiSceneValue, lowerUiSceneToSurface } from './ui-scene-ir.js';

function attribute(
  element: UiSceneBrowserElement,
  name: string,
): string | undefined {
  return element.attributes.find((entry) => entry.name === name)?.value;
}

function rowText(scene: typeof debuggerScene, y: number): string {
  const { surface } = lowerUiSceneToSurface(scene);
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}

describe('ui-scene-ir/1 browser seam', () => {
  it('lowers the debugger fixture to exact browser markup', () => {
    const lowered = lowerUiSceneToBrowser(debuggerScene);
    expect(lowered.markup).toBe(debuggerSceneMarkup);
    expect(renderUiSceneBrowserMarkup(lowered.root)).toBe(debuggerSceneMarkup);
    expect(lowered.endpoint).toBe('ui-scene-browser/1');
    expect(lowered.targetProfile).toEqual({
      kind: 'geordi-browser',
      width: 640,
      height: 360,
    });
  });

  it('lowers the same scene to the same output every time', () => {
    const first = lowerUiSceneToBrowser(debuggerScene);
    const second = lowerUiSceneToBrowser(
      structuredClone(debuggerScene),
    );
    expect(second).toEqual(first);
    expect(first.sceneHash).toBe(hashUiSceneValue(debuggerScene));
    expect(first.markupHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(second.markupHash).toBe(first.markupHash);
  });

  it('exposes the element tree that the markup serializes', () => {
    const { root } = lowerUiSceneToBrowser(debuggerScene);
    expect(root.tag).toBe('div');
    expect(attribute(root, 'data-bijou-scene-id')).toBe(debuggerScene.id);
    expect(root.children).toHaveLength(1);
    const pane = root.children[0];
    expect(pane?.tag).toBe('div');
    expect(pane?.text).toBeUndefined();
    expect(pane?.children.map((child) => child.tag)).toEqual([
      'span',
      'span',
      'span',
    ]);
    expect(
      pane?.children.map((child) => attribute(child, 'data-bijou-node-id')),
    ).toEqual(['debugger.title', 'debugger.tick', 'debugger.step']);
    expect(pane?.children.map((child) => child.text)).toEqual([
      'Debugger',
      'Tick 12 <paused> & "held"',
      'Step',
    ]);
  });

  it('leaves terminal lowering of the same fixture unchanged', () => {
    const browser = lowerUiSceneToBrowser(debuggerScene);
    const terminal = lowerUiSceneToSurface(debuggerScene);
    expect(terminal.sceneHash).toBe(browser.sceneHash);
    expect(rowText(debuggerScene, 0)).toBe('Debugger');
    expect(rowText(debuggerScene, 1)).toBe('Tick 12 <paused> & "held"');
    expect(rowText(debuggerScene, 2)).toBe('  Step');
    expect(terminal.cellSourceMap.map((entry) => entry.nodeId)).toEqual([
      'debugger.title',
      'debugger.tick',
      'debugger.step',
    ]);
    expect(terminal.surfaceHash).toBe(
      lowerUiSceneToSurface(debuggerScene).surfaceHash,
    );
  });
});
