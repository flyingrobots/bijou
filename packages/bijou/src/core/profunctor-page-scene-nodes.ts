import type { UiNode, UiTokenUse } from './ui-scene-ir.js';
import type { ProfunctorPageNode } from './profunctor-page-model.js';
import type { PlannedPageNode } from './profunctor-page-scene.js';

export function sceneNodes(
  plan: PlannedPageNode,
  root: PlannedPageNode,
  plans: readonly PlannedPageNode[],
): UiNode[] {
  const isRoot = plan === root;
  const children = isRoot
    ? [...plan.lineIds, ...plans.filter((item) => item !== root).map((item) => item.renderNodeId)]
    : plan.lineIds;
  const group: UiNode = {
    id: plan.renderNodeId,
    kind: 'group',
    role: 'region',
    ...(isRoot ? {} : { parentId: root.renderNodeId }),
    children,
    layout: plan.region,
    metadata: metadata(plan.node),
  };
  return [group, ...plan.lines.map((line, index): UiNode => ({
    id: lineId(plan, index),
    kind: 'text',
    parentId: plan.renderNodeId,
    role: index === 0 ? 'heading' : 'text',
    layout: { x: 0, y: isRoot ? index : plan.region.y + index },
    text: { kind: 'literal', value: line.text },
    style: { fg: { token: index === 0 ? 'semantic.interactive' : 'semantic.text' } },
    actions: line.actionId == null ? [] : [line.actionId],
    metadata: metadata(plan.node),
  }))];
}

export function actionTargets(
  plans: readonly PlannedPageNode[],
): Map<string, string> {
  return new Map(plans.flatMap((plan) => plan.lines.flatMap((line, index) => (
    line.actionId == null ? [] : [[line.actionId, lineId(plan, index)] as const]
  ))));
}

export function tokenUses(nodes: readonly UiNode[]): UiTokenUse[] {
  return nodes.flatMap((node) => node.style?.fg == null
    ? []
    : [{ nodeId: node.id, slot: 'fg', token: node.style.fg.token }]);
}

function metadata(node: ProfunctorPageNode): Record<string, unknown> {
  return {
    blockDefinitionId: node.blockDefinitionId,
    pageNodeId: node.pageNodeId,
    templateNodeId: node.templateNodeId,
  };
}

function lineId(plan: PlannedPageNode, index: number): string {
  const id = plan.lineIds[index];
  if (id == null) {
    throw new Error(`Missing planned line ${String(index)} for ${plan.renderNodeId}`);
  }
  return id;
}
