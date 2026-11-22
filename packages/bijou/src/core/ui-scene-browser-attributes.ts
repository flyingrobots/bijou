import {
  UI_SCENE_BROWSER_ENDPOINT_VERSION,
  type UiSceneBrowserAttribute,
  type UiSceneBrowserTargetProfile,
} from './ui-scene-browser-contract.js';
import { browserNodeStyle } from './ui-scene-browser-style.js';
import type { UiNode, UiSceneIr } from './ui-scene-contract.js';

/** Scene facts indexed by the node they belong to. */
export interface UiSceneBrowserFacts {
  readonly actionIds: ReadonlyMap<string, readonly string[]>;
  readonly bindingIds: ReadonlyMap<string, readonly string[]>;
  readonly sources: ReadonlyMap<string, string>;
  readonly tokenColors: Readonly<Record<string, string>> | undefined;
}

export function collectBrowserFacts(
  scene: UiSceneIr,
  tokenColors: Readonly<Record<string, string>> | undefined,
): UiSceneBrowserFacts {
  const actionIds = new Map<string, string[]>();
  for (const node of scene.nodes) {
    for (const actionId of node.actions ?? []) add(actionIds, node.id, actionId);
  }
  for (const action of scene.actions) {
    if (action.targetNodeId != null) {
      add(actionIds, action.targetNodeId, action.id);
    }
  }
  const bindingIds = new Map<string, string[]>();
  for (const binding of scene.bindings) {
    add(bindingIds, binding.targetNodeId, binding.id);
  }
  return {
    actionIds,
    bindingIds,
    sources: new Map(
      scene.sourceMap.map((entry) => [entry.nodeId, entry.source]),
    ),
    tokenColors,
  };
}

export function browserSceneAttributes(
  scene: UiSceneIr,
  target: UiSceneBrowserTargetProfile,
): readonly UiSceneBrowserAttribute[] {
  return [
    { name: 'data-bijou-scene-id', value: scene.id },
    { name: 'data-bijou-ir-version', value: scene.irVersion },
    { name: 'data-bijou-endpoint', value: UI_SCENE_BROWSER_ENDPOINT_VERSION },
    { name: 'data-bijou-source-hash', value: scene.sourceHash },
    { name: 'data-bijou-target', value: target.kind },
    { name: 'data-bijou-target-width', value: String(target.width) },
    { name: 'data-bijou-target-height', value: String(target.height) },
  ];
}

export function browserNodeAttributes(
  node: UiNode,
  facts: UiSceneBrowserFacts,
): readonly UiSceneBrowserAttribute[] {
  const optional: readonly (readonly [string, string | undefined])[] = [
    ['data-bijou-role', node.role],
    ['data-bijou-component', node.component],
    ['data-bijou-action', list(node, 'action', facts.actionIds.get(node.id))],
    ['data-bijou-binding', list(node, 'binding', facts.bindingIds.get(node.id))],
    ['data-bijou-i18n-key', node.text?.kind === 'i18n' ? node.text.key : undefined],
    ['data-bijou-source', facts.sources.get(node.id)],
    ['data-bijou-fg-token', node.style?.fg?.token],
    ['data-bijou-bg-token', node.style?.bg?.token],
    ['data-bijou-border-token', node.style?.border?.token],
    ['data-bijou-modifiers', list(node, 'modifiers', node.style?.modifiers)],
    ['style', browserNodeStyle(node, facts.tokenColors)],
  ];
  return [
    { name: 'data-bijou-node-id', value: node.id },
    { name: 'data-bijou-node-kind', value: node.kind },
    ...optional.flatMap(([name, value]) =>
      value == null ? [] : [{ name, value }],
    ),
  ];
}

function add(index: Map<string, string[]>, nodeId: string, id: string): void {
  const ids = index.get(nodeId) ?? [];
  if (!ids.includes(id)) ids.push(id);
  index.set(nodeId, ids);
}

function list(
  node: UiNode,
  name: string,
  values: readonly string[] | undefined,
): string | undefined {
  if (values == null || values.length === 0) return undefined;
  for (const value of values) {
    if (value !== '' && !/\s/u.test(value)) continue;
    const problem = value === '' ? 'is empty' : 'contains whitespace';
    throw new Error(
      `Cannot lower ui-scene-ir/1 node ${node.id} to geordi-browser: data-bijou-${name} value "${value}" ${problem}.`,
    );
  }
  return values.join(' ');
}
