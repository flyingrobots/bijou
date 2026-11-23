import type { UiSceneBrowserLowering } from './ui-scene-browser-contract.js';
import type { UiSceneSurfaceLowering } from './ui-scene-lowering.js';
import { browserParityNodes } from './ui-scene-parity-browser-facts.js';
import {
  UI_SCENE_PARITY_VERSION,
  type UiSceneParityComparison,
} from './ui-scene-parity-contract.js';
import { parityFinding } from './ui-scene-parity-findings.js';
import { parityNodeFindings } from './ui-scene-parity-node.js';
import { terminalParityNodes } from './ui-scene-parity-terminal-facts.js';

/**
 * Compares a terminal lowering and a browser lowering of one scene. It reads
 * only the two outputs: the Surface cells and cell source map on one side,
 * the element tree on the other.
 */
export function compareUiSceneLowerings(
  terminal: UiSceneSurfaceLowering,
  browser: UiSceneBrowserLowering,
): UiSceneParityComparison {
  if (terminal.sceneHash !== browser.sceneHash) {
    throw new Error(
      'Cannot compare lowerings of different ui-scene-ir/1 scenes.',
    );
  }
  const drawn = terminalParityNodes(terminal);
  const elements = browserParityNodes(browser.root);
  const placed = new Set(elements.map((element) => element.nodeId));
  return {
    witnessVersion: UI_SCENE_PARITY_VERSION,
    status: 'compared',
    sceneHash: terminal.sceneHash,
    surfaceHash: terminal.surfaceHash,
    markupHash: browser.markupHash,
    findings: [
      ...elements.flatMap((element) =>
        parityNodeFindings(
          element,
          drawn.get(element.nodeId),
          terminal.targetProfile,
        ),
      ),
      ...[...drawn.keys()]
        .filter((nodeId) => !placed.has(nodeId))
        .map((nodeId) =>
          parityFinding(nodeId, 'node', 'mismatch', { terminal: 'text' }),
        ),
    ],
  };
}
