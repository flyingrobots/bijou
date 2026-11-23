import {
  browserNodeAttributes,
  browserSceneAttributes,
  collectBrowserFacts,
  type UiSceneBrowserFacts,
} from './ui-scene-browser-attributes.js';
import {
  UI_SCENE_BROWSER_ENDPOINT_VERSION,
  type UiSceneBrowserElement,
  type UiSceneBrowserLowering,
  type UiSceneBrowserLoweringOptions,
} from './ui-scene-browser-contract.js';
import { renderUiSceneBrowserMarkup } from './ui-scene-browser-markup.js';
import {
  assertBrowserNodeKinds,
  assertSupportedBrowserRequirements,
  browserTargetProfile,
} from './ui-scene-browser-target.js';
import { hashUiSceneValue } from './ui-scene-canonical.js';
import type { UiNode, UiSceneIr } from './ui-scene-contract.js';
import { nodeTextForMode } from './ui-scene-lowering-utils.js';
import type { UiSceneLowerMode } from './ui-scene-lowering.js';
import { validateUiSceneIr } from './ui-scene-validation.js';

interface TreeContext {
  readonly nodes: ReadonlyMap<string, UiNode>;
  readonly placed: Set<string>;
  readonly facts: UiSceneBrowserFacts;
  readonly lowerMode: UiSceneLowerMode;
}

/**
 * Lowers a `ui-scene-ir/1` scene to a browser element tree and its markup.
 * The output holds only facts the scene declares: it resolves no binding,
 * runs no action and keeps no state.
 */
export function lowerUiSceneToBrowser(
  scene: UiSceneIr,
  options: UiSceneBrowserLoweringOptions = {},
): UiSceneBrowserLowering {
  const validation = validateUiSceneIr(scene);
  if (!validation.ok) {
    throw new Error(
      `Invalid ui-scene-ir/1: ${validation.issues.map((issue) => issue.message).join('; ')}`,
    );
  }
  const targetProfile = browserTargetProfile(scene);
  assertSupportedBrowserRequirements(
    targetProfile,
    options.supportedRequirements,
  );
  assertBrowserNodeKinds(scene.nodes);
  const sceneHash = hashUiSceneValue(scene);
  const context: TreeContext = {
    nodes: new Map(scene.nodes.map((node) => [node.id, node])),
    placed: new Set(),
    facts: collectBrowserFacts(scene, options.tokenColors),
    lowerMode: options.lowerMode ?? 'normal',
  };
  const tree = lowerNode(scene.rootNodeId, context);
  for (const node of scene.nodes) {
    if (!context.placed.has(node.id)) {
      throw new Error(
        `Cannot lower ui-scene-ir/1 node ${node.id} to geordi-browser: the root node does not reach it.`,
      );
    }
  }
  const root: UiSceneBrowserElement = {
    tag: 'div',
    attributes: browserSceneAttributes(scene, targetProfile),
    children: [tree],
  };
  const markup = renderUiSceneBrowserMarkup(root);
  return {
    endpoint: UI_SCENE_BROWSER_ENDPOINT_VERSION,
    root,
    markup,
    targetProfile,
    sceneHash,
    markupHash: hashUiSceneValue(markup),
  };
}

function lowerNode(nodeId: string, context: TreeContext): UiSceneBrowserElement {
  const node = context.nodes.get(nodeId);
  if (node == null) {
    throw new Error(`Cannot lower missing ui-scene-ir/1 node ${nodeId}.`);
  }
  if (context.placed.has(nodeId)) {
    throw new Error(
      `Cannot lower ui-scene-ir/1 node ${nodeId} to geordi-browser: the tree places it more than once.`,
    );
  }
  context.placed.add(nodeId);
  const text =
    node.kind === 'text' ? nodeTextForMode(node, context.lowerMode) : '';
  return {
    tag: node.kind === 'text' ? 'span' : 'div',
    attributes: browserNodeAttributes(node, context.facts),
    ...(text === '' ? {} : { text }),
    children: (node.children ?? []).map((childId) =>
      lowerNode(childId, context),
    ),
  };
}
