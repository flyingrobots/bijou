import type { UiAction, UiSceneIr } from './ui-scene-ir.js';
import type { PageAction } from './profunctor-page-actions.js';
import { linesForPageNode, sourceRefs, type PageLine } from './profunctor-page-lines.js';
import type {
  ProfunctorPageArtifact,
  ProfunctorPageNode,
} from './profunctor-page-model.js';
import type {
  ProfunctorPageCapabilityOutcome,
  ProfunctorPageInspectionMode,
} from './profunctor-page-target-types.js';
import {
  actionTargets,
  sceneNodes,
  tokenUses,
} from './profunctor-page-scene-nodes.js';
import { validatePageSceneBounds } from './profunctor-page-scene-bounds.js';

export const PAGE_TARGET_COLS = 100;
export const PAGE_TARGET_ROWS = 28;

export interface PageSceneRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PageSceneBuild {
  readonly scene: UiSceneIr;
  readonly regions: ReadonlyMap<string, PageSceneRegion>;
}

export interface PlannedPageNode {
  readonly node: ProfunctorPageNode;
  readonly renderNodeId: string;
  readonly region: PageSceneRegion;
  readonly lines: readonly PageLine[];
  readonly lineIds: readonly string[];
}

export function buildProfunctorPageScene(
  page: ProfunctorPageArtifact,
  sourceHash: string,
  actions: readonly PageAction[],
  outcomes: readonly ProfunctorPageCapabilityOutcome[],
  mode: ProfunctorPageInspectionMode,
): PageSceneBuild {
  const plans = planNodes(page, actions, outcomes, mode);
  validatePageSceneBounds(
    plans,
    page.rootNodeId,
    PAGE_TARGET_COLS,
    PAGE_TARGET_ROWS,
  );
  const root = plans.find((plan) => plan.node.pageNodeId === page.rootNodeId);
  if (root == null) {
    throw new Error(`Missing planned root ${page.rootNodeId}`);
  }
  const nodes = plans.flatMap((plan) => sceneNodes(plan, root, plans));
  const actionTarget = actionTargets(plans);
  const scene: UiSceneIr = {
    irVersion: 'ui-scene-ir/1',
    id: `bijou-scene:${page.pageId}/${mode}`,
    sourceHash,
    rootNodeId: root.renderNodeId,
    nodes,
    bindings: [],
    actions: actions.map((action): UiAction => ({
      id: action.actionId,
      command: `profunctor-page.open:${action.target}`,
      label: { kind: 'literal', value: action.label },
      targetNodeId: actionTarget.get(action.actionId),
    })),
    tokenUses: tokenUses(nodes),
    i18nUses: [],
    sourceMap: plans.flatMap((plan) => [
      { nodeId: plan.renderNodeId, source: sourceRefs(plan.node).join(' | ') },
      ...plan.lineIds.map((nodeId) => ({
        nodeId,
        source: sourceRefs(plan.node).join(' | '),
      })),
    ]),
    targetProfiles: [{
      kind: 'bijou-terminal',
      cols: PAGE_TARGET_COLS,
      rows: PAGE_TARGET_ROWS,
      requires: ['ui-scene/core/1', 'ui-scene/text/1', 'ui-scene/tokens/1', 'ui-scene/actions/1'],
      claims: ['deterministic cells', 'inspection facts'],
    }],
    portability: {
      level: 'terminal-native',
      reasons: ['Bijou owns terminal geometry and does not inherit browser claims.'],
    },
  };
  return {
    scene,
    regions: new Map(plans.map((plan) => [plan.node.pageNodeId, plan.region])),
  };
}

function planNodes(
  page: ProfunctorPageArtifact,
  actions: readonly PageAction[],
  outcomes: readonly ProfunctorPageCapabilityOutcome[],
  mode: ProfunctorPageInspectionMode,
): PlannedPageNode[] {
  let y = 0;
  return page.readingOrder.flatMap((pageNodeId) => {
    const node = page.nodes.find((item) => item.pageNodeId === pageNodeId);
    if (node == null || node.hidden) {
      return [];
    }
    const lines = linesForPageNode(page, node, actions, outcomes, mode);
    const isRoot = pageNodeId === page.rootNodeId;
    const height = isRoot ? PAGE_TARGET_ROWS : Math.max(1, lines.length);
    const region = { x: 0, y, width: PAGE_TARGET_COLS, height };
    const renderNodeId = renderId(pageNodeId);
    const lineIds = lines.map((_, index) => `${renderNodeId}/line-${String(index)}`);
    y = isRoot ? lines.length + 1 : y + height + 1;
    return [{ node, renderNodeId, region, lines, lineIds }];
  });
}

export function renderId(pageNodeId: string): string {
  return `bijou-render:${pageNodeId}`;
}
