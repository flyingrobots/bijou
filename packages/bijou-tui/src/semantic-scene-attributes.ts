/**
 * The attribute that carries `UiNode.id` on each element that the
 * `ui-scene-ir/1` browser seam lowers.
 */
export const UI_SCENE_NODE_ID_ATTRIBUTE = 'data-bijou-node-id' as const;

/**
 * The attribute that carries the action ids of a node. The browser seam
 * writes the ids from `UiNode.actions`, then the ids of actions whose
 * `targetNodeId` is the node, separated by spaces.
 */
export const UI_SCENE_ACTION_ATTRIBUTE = 'data-bijou-action' as const;

/** Split a `data-bijou-action` value into action ids, in order. */
export function parseUiSceneActionAttribute(value: string): readonly string[] {
  return value.split(/\s+/u).filter((actionId) => actionId !== '');
}
