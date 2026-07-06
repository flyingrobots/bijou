import { hashUiSceneValue } from './ui-scene-ir.js';
import { compileGraphqlBijouBlock } from './graphql-bijou-block.part02.js';
import { lowerBijouBlockToUiScene } from './graphql-bijou-block.part03.js';
import { createGraphqlBijouBlockDebugSummary } from './graphql-bijou-block.part04.js';
import { normalizeSourceName } from './graphql-bijou-block.part10.js';
import {
  VISOR_ARTIFACT_BUNDLE_VERSION,
  type CreateVisorArtifactBundleFromGraphqlOptions,
  type CreateVisorArtifactBundleInput,
  type VisorArtifactBundle,
  type VisorArtifactBundleHashBody,
} from './visor-artifact-bundle.part01.js';
import {
  createVisorReplayMetadata,
  createVisorVisualSceneFacts,
} from './visor-artifact-bundle.part03.js';
import {
  assertDebugSummaryMatchesFacts,
  assertSceneMatchesArtifact,
  createReceipts,
  normalizeLogicalId,
  semanticBundleHashPayload,
} from './visor-artifact-bundle.part04.js';

export function createVisorArtifactBundleFromGraphql(
  source: string,
  options: CreateVisorArtifactBundleFromGraphqlOptions,
): VisorArtifactBundle {
  const sourceName = normalizeSourceName(options.sourceName);
  const bijouBlock = compileGraphqlBijouBlock(source, { sourceName });
  const uiScene = lowerBijouBlockToUiScene(bijouBlock);
  const debugSummary = createGraphqlBijouBlockDebugSummary(bijouBlock, options);
  return createVisorArtifactBundle({
    ...options,
    sourceName,
    sourceText: source,
    bijouBlock,
    uiScene,
    debugSummary,
  });
}

export function createVisorArtifactBundle(input: CreateVisorArtifactBundleInput): VisorArtifactBundle {
  const fixtureId = normalizeLogicalId(input.fixtureId, 'fixtureId');
  const scenarioId = normalizeLogicalId(input.scenarioId ?? `${fixtureId}:graphql-to-ui-scene`, 'scenarioId');
  const deterministicSeed = input.deterministicSeed ?? 'no-randomness';
  const sourceName = normalizeSourceName(input.sourceName);

  if (input.bijouBlock.sourceName !== sourceName) {
    throw new Error('visor-artifact-bundle/1 sourceName does not match bijou-block/1.');
  }

  const visual = createVisorVisualSceneFacts(input.uiScene, input.debugSummary);
  const visualFactsHash = hashUiSceneValue(visual);
  assertSceneMatchesArtifact(input.bijouBlock, input.uiScene);
  assertDebugSummaryMatchesFacts(input.bijouBlock, input.uiScene, input.debugSummary);

  const sourceHash = hashUiSceneValue(input.sourceText);
  const normalizedSourceHash = input.bijouBlock.sourceHash;
  const artifactHash = hashUiSceneValue(input.bijouBlock);
  const sceneHash = hashUiSceneValue(input.uiScene);
  const debugSummaryHash = input.debugSummary.summaryHash;
  const replay = createVisorReplayMetadata({
    fixtureId,
    scenarioId,
    deterministicSeed,
    sourceHash,
    normalizedSourceHash,
    artifactHash,
    sceneHash,
    debugSummaryHash,
    visualFactsHash,
  });
  const replayHash = hashUiSceneValue(replay);
  const hashes: VisorArtifactBundleHashBody = {
    sourceHash,
    normalizedSourceHash,
    artifactHash,
    sceneHash,
    debugSummaryHash,
    replayHash,
    visualFactsHash,
  };
  const bundleWithoutHash = {
    bundleVersion: VISOR_ARTIFACT_BUNDLE_VERSION,
    fixture: { id: fixtureId, sourceName, sourceHash, normalizedSourceHash },
    source: { language: 'graphql' as const, text: input.sourceText },
    artifacts: {
      bijouBlock: input.bijouBlock,
      uiScene: input.uiScene,
      debugSummary: input.debugSummary,
    },
    replay,
    visual,
    hashes: { ...hashes, bundleHash: undefined },
    receipts: createReceipts({
      artifactHash,
      sceneHash,
      debugSummaryHash,
      replayHash,
      visualFactsHash,
    }),
  };
  return {
    ...bundleWithoutHash,
    hashes: {
      ...hashes,
      bundleHash: hashUiSceneValue(semanticBundleHashPayload(bundleWithoutHash)),
    },
  };
}
