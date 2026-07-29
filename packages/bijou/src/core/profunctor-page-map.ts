import { SUPPORTED_PAGE_BLOCKS } from './profunctor-page-block-contract.js';
import type { PageAction } from './profunctor-page-actions.js';
import { sourceRefs } from './profunctor-page-lines.js';
import type {
  ProfunctorPageArtifact,
  ProfunctorPageSourceMap,
} from './profunctor-page-model.js';
import { renderId, type PageSceneRegion } from './profunctor-page-scene.js';
import type {
  ProfunctorPageCapabilityOutcome,
  ProfunctorPageTargetMap,
} from './profunctor-page-target-types.js';
import type { UiCellSourceMapEntry } from './ui-scene-ir.js';

export function createProfunctorPageTargetMap(
  page: ProfunctorPageArtifact,
  sourceMap: ProfunctorPageSourceMap,
  sceneId: string,
  regions: ReadonlyMap<string, PageSceneRegion>,
  actions: readonly PageAction[],
  outcomes: readonly ProfunctorPageCapabilityOutcome[],
  cellSourceMap: readonly UiCellSourceMapEntry[],
): ProfunctorPageTargetMap {
  return {
    artifactVersion: 'bijou-profunctor-page-map/1',
    pageId: page.pageId,
    compositionRef: page.compositionRef,
    overrideRefs: page.overrideRefs,
    route: page.route,
    sceneId,
    targetProfile: 'bijou-terminal-project-page/1',
    entries: page.readingOrder.map((pageNodeId) => {
      const node = page.nodes.find((item) => item.pageNodeId === pageNodeId);
      if (node == null) {
        throw new Error(`Missing validated page node ${pageNodeId}`);
      }
      const region = regions.get(pageNodeId) ?? null;
      const hiddenUnsupported = node.hidden && !SUPPORTED_PAGE_BLOCKS.has(node.blockDefinitionId);
      return {
        pageNodeId,
        templateNodeId: node.templateNodeId,
        contentNodeId: node.contentNodeId,
        blockDefinitionId: node.blockDefinitionId,
        renderNodeId: region == null ? null : renderId(pageNodeId),
        region,
        residual: region == null
          ? {
              kind: hiddenUnsupported ? 'hidden-unsupported-block' : 'hidden-node',
              blockDefinitionId: node.blockDefinitionId,
            }
          : null,
        sourceRefs: sourceRefs(node),
        tokenRefs: Object.values(node.tokens),
        actionIds: actions
          .filter((action) => action.pageNodeId === pageNodeId)
          .map((action) => action.actionId),
        requiredCapabilities: node.requiredCapabilities,
      };
    }),
    readingOrder: page.readingOrder,
    outline: page.outline,
    landmarks: page.landmarks,
    tokenRefs: page.tokenRefs,
    sourceOccurrences: sourceMap.entries
      .map((entry) => entry.sourceOccurrenceId)
      .sort(compareCodeUnits),
    actions: actions.map((action) => ({
      actionId: action.actionId,
      pageNodeId: action.pageNodeId,
      label: action.label,
      target: action.target,
    })),
    capabilityOutcomes: outcomes,
    cellSourceMap,
  };
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
