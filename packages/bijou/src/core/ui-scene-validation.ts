import {
  UI_SCENE_IR_VERSION,
  type UiSceneIr,
  type UiSceneValidationIssue,
  type UiSceneValidationResult,
} from './ui-scene-contract.js';
import { validateTargetProfile } from './ui-scene-target-profile.js';

export function validateUiSceneIr(scene: UiSceneIr): UiSceneValidationResult {
  const issues: UiSceneValidationIssue[] = [];
  const version: string = scene.irVersion;
  if (version !== UI_SCENE_IR_VERSION) {
    add(issues, 'unsupported-ir-version', `Unsupported UI scene IR version: ${version}`, version);
  }
  const nodeIds = ids(scene.nodes);
  const actionIds = ids(scene.actions);
  const bindingIds = ids(scene.bindings);
  if (!nodeIds.all.has(scene.rootNodeId)) {
    add(issues, 'root-node-missing', `Root node does not exist: ${scene.rootNodeId}`, scene.rootNodeId);
  }
  for (const id of nodeIds.duplicates) {
    add(issues, 'duplicate-node-id', `Duplicate node id: ${id}`, id);
  }
  for (const id of actionIds.duplicates) {
    add(issues, 'duplicate-action-id', `Duplicate action id: ${id}`, id);
  }
  for (const id of bindingIds.duplicates) {
    add(issues, 'duplicate-binding-id', `Duplicate binding id: ${id}`, id);
  }
  for (const node of scene.nodes) {
    if (node.parentId != null && !nodeIds.all.has(node.parentId)) {
      add(issues, 'parent-node-missing', `Node ${node.id} references missing parent ${node.parentId}`, node.id);
    }
    for (const childId of node.children ?? []) {
      if (!nodeIds.all.has(childId)) {
        add(issues, 'child-node-missing', `Node ${node.id} references missing child ${childId}`, node.id);
      }
    }
    for (const actionId of node.actions ?? []) {
      if (!actionIds.all.has(actionId)) {
        add(issues, 'node-action-missing', `Node ${node.id} references missing action ${actionId}`, node.id);
      }
    }
  }
  for (const action of scene.actions) {
    if (action.targetNodeId != null && !nodeIds.all.has(action.targetNodeId)) {
      add(
        issues,
        'action-target-missing',
        `Action ${action.id} references missing target ${action.targetNodeId}`,
        action.id,
      );
    }
  }
  for (const binding of scene.bindings) {
    if (!nodeIds.all.has(binding.targetNodeId)) {
      add(
        issues,
        'binding-target-missing',
        `Binding ${binding.id} references missing target ${binding.targetNodeId}`,
        binding.id,
      );
    }
  }
  for (const use of scene.tokenUses) {
    if (!nodeIds.all.has(use.nodeId)) {
      add(issues, 'token-node-missing', `Token ${use.token} references missing node ${use.nodeId}`, use.nodeId);
    }
  }
  for (const use of scene.i18nUses) {
    if (use.nodeId != null && !nodeIds.all.has(use.nodeId)) {
      add(issues, 'i18n-node-missing', `I18n key ${use.key} references missing node ${use.nodeId}`, use.nodeId);
    }
    if (use.actionId != null && !actionIds.all.has(use.actionId)) {
      add(issues, 'i18n-action-missing', `I18n key ${use.key} references missing action ${use.actionId}`, use.actionId);
    }
  }
  for (const entry of scene.sourceMap) {
    if (!nodeIds.all.has(entry.nodeId)) {
      add(issues, 'source-map-node-missing', `Source map references missing node ${entry.nodeId}`, entry.nodeId);
    }
  }
  for (const [index, profile] of scene.targetProfiles.entries()) {
    const issue = validateTargetProfile(profile, index);
    if (issue != null) issues.push(issue);
  }
  return { ok: issues.length === 0, issues };
}

function ids(items: readonly { readonly id: string }[]): {
  readonly all: ReadonlySet<string>;
  readonly duplicates: ReadonlySet<string>;
} {
  const all = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (all.has(item.id)) duplicates.add(item.id);
    else all.add(item.id);
  }
  return { all, duplicates };
}

function add(
  issues: UiSceneValidationIssue[],
  code: UiSceneValidationIssue['code'],
  message: string,
  id: string,
): void {
  issues.push({ code, message, id });
}
