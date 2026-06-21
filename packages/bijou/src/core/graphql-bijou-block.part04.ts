import { hashUiSceneValue, lowerUiSceneToTerminalProof } from './ui-scene-ir.js';

import type { UiSceneLoweringOptions } from './ui-scene-ir.js';

import { GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION } from './graphql-bijou-block.part01.js';

import type { BijouBlockArtifact, GraphqlBijouBlockDebugSummary } from './graphql-bijou-block.part01.js';

import { DEBUG_LOWER_MODES } from './graphql-bijou-block.part02.js';

import { lowerBijouBlockToUiScene } from './graphql-bijou-block.part03.js';

import { debugFieldFact, debugGroupFacts, sortedUniqueStrings, surfaceRows } from './graphql-bijou-block.part09.js';
export function createGraphqlBijouBlockDebugSummary(
  artifact: BijouBlockArtifact,
  options: UiSceneLoweringOptions = {},
): GraphqlBijouBlockDebugSummary {
  const scene = lowerBijouBlockToUiScene(artifact);
  const body = {
    summaryVersion: GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION,
    artifactVersion: artifact.artifactVersion,
    artifactId: artifact.id,
    artifactHash: hashUiSceneValue(artifact),
    sceneHash: hashUiSceneValue(scene),
    rootNodeId: artifact.rootNodeId,
    groups: debugGroupFacts(artifact),
    fields: artifact.fields.map(debugFieldFact),
    sourceMap: scene.sourceMap,
    i18nKeys: sortedUniqueStrings(scene.i18nUses.map((use) => use.key)),
    tokenRefs: sortedUniqueStrings(scene.tokenUses.map((use) => use.token)),
    actionIds: sortedUniqueStrings(scene.actions.map((action) => action.id)),
    bindingIds: sortedUniqueStrings(scene.bindings.map((binding) => binding.id)),
    lowerModes: DEBUG_LOWER_MODES.map((mode) => {
      const proof = lowerUiSceneToTerminalProof(scene, {
        ...options,
        lowerMode: mode,
      });
      return {
        mode,
        surfaceHash: proof.lowering.surfaceHash,
        rows: surfaceRows(proof.lowering.surface),
      };
    }),
  } satisfies Omit<GraphqlBijouBlockDebugSummary, 'summaryHash'>;

  return {
    ...body,
    summaryHash: hashUiSceneValue({ ...body, summaryHash: undefined }),
  };
}
