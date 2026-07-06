import { hashUiSceneValue, type UiNodeKind, type UiSceneIr, type UiTextRef } from './ui-scene-ir.js';
import type { GraphqlBijouBlockDebugSummary } from './graphql-bijou-block.part01.js';
import {
  VISOR_REPLAY_METADATA_VERSION,
  VISOR_VISUAL_SCENE_FACTS_VERSION,
  type VisorReplayMetadata,
  type VisorReplayStep,
  type VisorVisualSceneFacts,
} from './visor-artifact-bundle.part01.js';
import {
  assertRequiredLowerModes,
  assertUniqueVisualNodeIds,
  sortedUniqueStrings,
} from './visor-artifact-bundle.part04.js';

type HashList = readonly string[];

export function createVisorVisualSceneFacts(
  scene: UiSceneIr,
  debugSummary: GraphqlBijouBlockDebugSummary,
): VisorVisualSceneFacts {
  assertUniqueVisualNodeIds(scene);
  assertRequiredLowerModes(debugSummary);
  return {
    visualFactsVersion: VISOR_VISUAL_SCENE_FACTS_VERSION,
    sceneId: scene.id,
    rootNodeId: scene.rootNodeId,
    targetProfiles: scene.targetProfiles,
    nodeFacts: scene.nodes.map((node) => {
      const fact: {
        nodeId: string;
        kind: UiNodeKind;
        role?: string;
        component?: string;
        parentId?: string;
        childNodeIds: readonly string[];
        text?: UiTextRef;
        i18nKeys: readonly string[];
        tokenRefs: readonly string[];
        actionIds: readonly string[];
        bindingIds: readonly string[];
        sourceRefs: readonly string[];
      } = {
        nodeId: node.id,
        kind: node.kind,
        childNodeIds: node.children ?? [],
        i18nKeys: sortedUniqueStrings(scene.i18nUses
          .filter((use) => use.nodeId === node.id)
          .map((use) => use.key)),
        tokenRefs: sortedUniqueStrings(scene.tokenUses
          .filter((use) => use.nodeId === node.id)
          .map((use) => use.token)),
        actionIds: sortedUniqueStrings([
          ...(node.actions ?? []),
          ...scene.actions.filter((action) => action.targetNodeId === node.id).map((action) => action.id),
        ]),
        bindingIds: sortedUniqueStrings(scene.bindings
          .filter((binding) => binding.targetNodeId === node.id)
          .map((binding) => binding.id)),
        sourceRefs: sortedUniqueStrings(scene.sourceMap
          .filter((entry) => entry.nodeId === node.id)
          .map((entry) => entry.source)),
      };
      if (node.role != null) fact.role = node.role;
      if (node.component != null) fact.component = node.component;
      if (node.parentId != null) fact.parentId = node.parentId;
      if (node.text != null) fact.text = node.text;
      return fact;
    }),
    lowerModes: debugSummary.lowerModes.map((lowerMode) => ({
      mode: lowerMode.mode,
      surfaceHash: lowerMode.surfaceHash,
      rowsHash: hashUiSceneValue(lowerMode.rows),
    })),
  };
}

export function createVisorReplayMetadata(input: {
  readonly fixtureId: string;
  readonly scenarioId: string;
  readonly deterministicSeed: string;
  readonly sourceHash: string;
  readonly normalizedSourceHash: string;
  readonly artifactHash: string;
  readonly sceneHash: string;
  readonly debugSummaryHash: string;
  readonly visualFactsHash: string;
}): VisorReplayMetadata {
  return {
    replayVersion: VISOR_REPLAY_METADATA_VERSION,
    scenarioId: input.scenarioId,
    fixtureId: input.fixtureId,
    deterministicSeed: input.deterministicSeed,
    consumedHashes: {
      sourceHash: input.normalizedSourceHash,
      normalizedSourceHash: input.normalizedSourceHash,
      artifactHash: input.artifactHash,
      sceneHash: input.sceneHash,
      debugSummaryHash: input.debugSummaryHash,
      visualFactsHash: input.visualFactsHash,
    },
    steps: [
      replayStep(
        'compile-graphql-bijou-block',
        'Compile GraphQL SDL into bijou-block/1.',
        [input.normalizedSourceHash],
        [input.artifactHash],
      ),
      replayStep(
        'lower-bijou-block-to-ui-scene',
        'Lower bijou-block/1 into ui-scene-ir/1.',
        [input.artifactHash],
        [input.sceneHash],
      ),
      replayStep(
        'summarize-graphql-bijou-block-debug',
        'Summarize grouped GraphQL block debug facts.',
        [input.artifactHash, input.sceneHash],
        [input.debugSummaryHash],
      ),
      replayStep(
        'extract-visual-scene-facts',
        'Extract VISOR visual scene facts from ui-scene-ir/1.',
        [input.sceneHash, input.debugSummaryHash],
        [input.visualFactsHash],
      ),
    ],
  };
}

function replayStep(id: string, label: string, inputHashes: HashList, outputHashes: HashList): VisorReplayStep {
  return { id, label, inputHashes, outputHashes };
}
