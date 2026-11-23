import { describe, expect, it } from 'vitest';
import {
  lowerUiSceneToBrowser,
  type UiSceneBrowserLowering,
} from './ui-scene-browser.js';
import { debuggerScene } from './ui-scene-browser.test-support.js';
import { lowerUiSceneToSurface } from './ui-scene-ir.js';
import { compareUiSceneLowerings } from './ui-scene-parity.js';
import {
  mismatches,
  withAttribute,
  withElement,
} from './ui-scene-parity.test-support.js';

function browserWith(
  nodeId: string,
  rewrite: Parameters<typeof withElement>[2],
): UiSceneBrowserLowering {
  const lowering = lowerUiSceneToBrowser(debuggerScene);
  return { ...lowering, root: withElement(lowering.root, nodeId, rewrite) };
}

describe('ui-scene-ir/1 parity witness falsification', () => {
  it('reports a mismatch when the browser text differs from the cells', () => {
    const witness = compareUiSceneLowerings(
      lowerUiSceneToSurface(debuggerScene),
      browserWith('debugger.step', (element) => ({ ...element, text: 'Stop' })),
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.step',
        fact: 'text',
        status: 'mismatch',
        terminal: 'Step',
        browser: 'Stop',
      },
    ]);
  });

  it('reports a mismatch when the terminal draws a different cell', () => {
    const terminal = lowerUiSceneToSurface(debuggerScene);
    terminal.surface.set(0, 0, { char: 'X', empty: false });
    const witness = compareUiSceneLowerings(
      terminal,
      lowerUiSceneToBrowser(debuggerScene),
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.title',
        fact: 'text',
        status: 'mismatch',
        terminal: 'Xebugger',
        browser: 'Debugger',
      },
      {
        nodeId: 'debugger.title',
        fact: 'modifiers',
        status: 'mismatch',
        terminal: '|bold',
        browser: 'bold',
      },
    ]);
  });

  it('reports a mismatch when a browser token differs', () => {
    const witness = compareUiSceneLowerings(
      lowerUiSceneToSurface(debuggerScene),
      browserWith('debugger.step', (element) =>
        withAttribute(element, 'data-bijou-fg-token', 'semantic.other.fg'),
      ),
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.step',
        fact: 'fg-token',
        status: 'mismatch',
        terminal: 'semantic.action.fg',
        browser: 'semantic.other.fg',
      },
    ]);
  });

  it('reports a mismatch when a browser position differs', () => {
    const witness = compareUiSceneLowerings(
      lowerUiSceneToSurface(debuggerScene),
      browserWith('debugger.step', (element) =>
        withAttribute(element, 'style', '--bijou-x:5;--bijou-y:2'),
      ),
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.step',
        fact: 'x',
        status: 'mismatch',
        terminal: '2',
        browser: '5',
      },
    ]);
  });

  it('reports a mismatch when the terminal omits a visible text node', () => {
    const terminal = lowerUiSceneToSurface(debuggerScene);
    const witness = compareUiSceneLowerings(
      {
        ...terminal,
        cellSourceMap: terminal.cellSourceMap.filter(
          (entry) => entry.nodeId !== 'debugger.tick',
        ),
      },
      lowerUiSceneToBrowser(debuggerScene),
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.tick',
        fact: 'node',
        status: 'mismatch',
        browser: 'text',
      },
    ]);
  });

  it('reports a mismatch when the terminal draws a node the browser lacks', () => {
    const browser = lowerUiSceneToBrowser(debuggerScene);
    const pane = browser.root.children[0];
    const witness = compareUiSceneLowerings(
      lowerUiSceneToSurface(debuggerScene),
      {
        ...browser,
        root: {
          ...browser.root,
          children:
            pane == null
              ? []
              : [{ ...pane, children: pane.children.slice(0, 2) }],
        },
      },
    );
    expect(mismatches(witness)).toEqual([
      {
        nodeId: 'debugger.step',
        fact: 'node',
        status: 'mismatch',
        terminal: 'text',
      },
    ]);
  });
});
