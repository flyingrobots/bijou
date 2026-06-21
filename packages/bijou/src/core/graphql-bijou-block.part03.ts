import { UI_SCENE_IR_VERSION } from './ui-scene-ir.js';

import type { UiAction, UiBinding, UiI18nUse, UiNode, UiSceneIr, UiSourceMapEntry, UiTokenUse } from './ui-scene-ir.js';

import type { BijouBlockArtifact } from './graphql-bijou-block.part01.js';

import { nodeForGroup, rootChildNodeIds } from './graphql-bijou-block.part06.js';

import { nodeForField } from './graphql-bijou-block.part07.js';

import { appendI18nUse, appendTokenUses, assertUniqueBlockIdentities } from './graphql-bijou-block.part08.js';
export function lowerBijouBlockToUiScene(artifact: BijouBlockArtifact): UiSceneIr {
  const groups = artifact.groups;
  assertUniqueBlockIdentities(groups, artifact.fields, artifact.rootNodeId);
  const nodes: UiNode[] = [
    {
      id: artifact.rootNodeId,
      kind: 'group',
      component: artifact.component,
      children: rootChildNodeIds(groups, artifact.fields),
      metadata: {
        artifactVersion: artifact.artifactVersion,
        sourceTypeName: artifact.sourceTypeName,
      },
    },
  ];
  const actions: UiAction[] = [];
  const bindings: UiBinding[] = [];
  const tokenUses: UiTokenUse[] = [];
  const i18nUses: UiI18nUse[] = [];
  const sourceMap: UiSourceMapEntry[] = [];

  for (const group of groups) {
    nodes.push(nodeForGroup(artifact, group));
    sourceMap.push({ nodeId: group.id, source: group.source });
  }

  for (const field of artifact.fields) {
    nodes.push(nodeForField(artifact, field));
    sourceMap.push({ nodeId: field.nodeId, source: field.source });
    appendTokenUses(tokenUses, field);
    appendI18nUse(i18nUses, field.nodeId, field.text);

    if (field.action != null) {
      actions.push({
        id: field.action.id,
        command: field.action.command,
        keybindings: field.action.keybindings,
        label: field.text,
        targetNodeId: field.nodeId,
      });
      appendI18nUse(i18nUses, field.action.id, field.text, 'action');
    }

    if (field.binding != null) {
      bindings.push({
        id: field.binding.id,
        targetNodeId: field.nodeId,
        targetProperty: field.binding.targetProperty,
        source: field.binding.source,
        when: field.binding.when,
      });
    }
  }

  return {
    irVersion: UI_SCENE_IR_VERSION,
    id: artifact.id,
    sourceHash: artifact.sourceHash,
    rootNodeId: artifact.rootNodeId,
    nodes,
    bindings,
    actions,
    tokenUses,
    i18nUses,
    sourceMap,
    targetProfiles: artifact.targetProfiles,
    portability: { level: 'portable' },
  };
}
