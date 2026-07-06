import { hashUiSceneValue, type UiSceneIr, type UiSceneLowerMode } from './ui-scene-ir.js';
import { lowerBijouBlockToUiScene } from './graphql-bijou-block.part03.js';
import type {
  BijouBlockArtifact,
  GraphqlBijouBlockDebugSummary,
} from './graphql-bijou-block.part01.js';
import {
  VISOR_REPLAY_METADATA_VERSION,
  VISOR_VISUAL_SCENE_FACTS_VERSION,
  type VisorArtifactBundleReceipt,
  type VisorArtifactBundleWithoutHash,
} from './visor-artifact-bundle.part01.js';

const REQUIRED_LOWER_MODES: readonly UiSceneLowerMode[] = [
  'normal',
  'node-ids',
  'i18n-keys',
  'token-refs',
];

export function assertSceneMatchesArtifact(artifact: BijouBlockArtifact, scene: UiSceneIr): void {
  if (hashUiSceneValue(lowerBijouBlockToUiScene(artifact)) !== hashUiSceneValue(scene)) {
    throw new Error('visor-artifact-bundle/1 ui-scene-ir/1 does not match bijou-block/1.');
  }
}

export function assertDebugSummaryMatchesFacts(
  artifact: BijouBlockArtifact,
  scene: UiSceneIr,
  debugSummary: GraphqlBijouBlockDebugSummary,
): void {
  if (debugSummary.artifactHash !== hashUiSceneValue(artifact)) {
    throw new Error('visor-artifact-bundle/1 debug summary artifact hash does not match bijou-block/1.');
  }
  if (debugSummary.sceneHash !== hashUiSceneValue(scene)) {
    throw new Error('visor-artifact-bundle/1 debug summary scene hash does not match ui-scene-ir/1.');
  }
  if (debugSummary.summaryHash !== hashUiSceneValue({ ...debugSummary, summaryHash: undefined })) {
    throw new Error('visor-artifact-bundle/1 debug summary hash does not match summary payload.');
  }
}

export function assertUniqueVisualNodeIds(scene: UiSceneIr): void {
  const seen = new Set<string>();
  for (const node of scene.nodes) {
    if (seen.has(node.id)) {
      throw new Error(`visor-artifact-bundle/1 visual facts contain duplicate node id: ${node.id}`);
    }
    seen.add(node.id);
  }
}

export function assertRequiredLowerModes(debugSummary: GraphqlBijouBlockDebugSummary): void {
  const available = new Set(debugSummary.lowerModes.map((lowerMode) => lowerMode.mode));
  for (const required of REQUIRED_LOWER_MODES) {
    if (!available.has(required)) {
      throw new Error(`visor-artifact-bundle/1 missing lower-mode witness: ${required}`);
    }
  }
}

export function semanticBundleHashPayload(bundle: VisorArtifactBundleWithoutHash): unknown {
  return {
    ...bundle,
    fixture: {
      ...bundle.fixture,
      sourceHash: undefined,
    },
    source: {
      ...bundle.source,
      text: undefined,
    },
    hashes: {
      ...bundle.hashes,
      sourceHash: undefined,
      bundleHash: undefined,
    },
  };
}

export function normalizeLogicalId(value: string, label: 'fixtureId' | 'scenarioId'): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`visor-artifact-bundle/1 ${label} cannot be empty.`);
  }
  if (
    trimmed.startsWith('/')
    || trimmed.startsWith('\\\\')
    || trimmed.startsWith('//')
    || /^[A-Za-z]:[\\/]/.test(trimmed)
    || trimmed.includes('\0')
  ) {
    throw new Error(`visor-artifact-bundle/1 ${label} must be a logical id.`);
  }
  return trimmed;
}

export function createReceipts(input: {
  readonly artifactHash: string;
  readonly sceneHash: string;
  readonly debugSummaryHash: string;
  readonly replayHash: string;
  readonly visualFactsHash: string;
}): readonly VisorArtifactBundleReceipt[] {
  return [
    { subject: 'artifacts.bijouBlock', version: 'bijou-block/1', hash: input.artifactHash },
    { subject: 'artifacts.uiScene', version: 'ui-scene-ir/1', hash: input.sceneHash },
    { subject: 'artifacts.debugSummary', version: 'graphql-bijou-block-debug/1', hash: input.debugSummaryHash },
    { subject: 'replay', version: VISOR_REPLAY_METADATA_VERSION, hash: input.replayHash },
    { subject: 'visual', version: VISOR_VISUAL_SCENE_FACTS_VERSION, hash: input.visualFactsHash },
  ];
}

export function sortedUniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
