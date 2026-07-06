import type {
  UiNodeKind,
  UiSceneIr,
  UiSceneLowerMode,
  UiSceneLoweringOptions,
  UiTargetProfile,
  UiTextRef,
} from './ui-scene-ir.js';
import type {
  BijouBlockArtifact,
  GraphqlBijouBlockDebugSummary,
} from './graphql-bijou-block.part01.js';

export const VISOR_ARTIFACT_BUNDLE_VERSION = 'visor-artifact-bundle/1' as const;
export const VISOR_REPLAY_METADATA_VERSION = 'visor-replay-metadata/1' as const;
export const VISOR_VISUAL_SCENE_FACTS_VERSION = 'visor-visual-scene-facts/1' as const;

export type VisorArtifactBundleVersion = typeof VISOR_ARTIFACT_BUNDLE_VERSION;
export type VisorReplayMetadataVersion = typeof VISOR_REPLAY_METADATA_VERSION;
export type VisorVisualSceneFactsVersion = typeof VISOR_VISUAL_SCENE_FACTS_VERSION;

export interface CreateVisorArtifactBundleFromGraphqlOptions extends UiSceneLoweringOptions {
  readonly fixtureId: string;
  readonly sourceName: string;
  readonly scenarioId?: string;
  readonly deterministicSeed?: string;
}

export interface CreateVisorArtifactBundleInput extends CreateVisorArtifactBundleFromGraphqlOptions {
  readonly sourceText: string;
  readonly bijouBlock: BijouBlockArtifact;
  readonly uiScene: UiSceneIr;
  readonly debugSummary: GraphqlBijouBlockDebugSummary;
}

export interface VisorArtifactBundleFixture {
  readonly id: string;
  readonly sourceName: string;
  readonly sourceHash: string;
  readonly normalizedSourceHash: string;
}

export interface VisorArtifactBundleSource {
  readonly language: 'graphql';
  readonly text: string;
}

export interface VisorArtifactBundleArtifacts {
  readonly bijouBlock: BijouBlockArtifact;
  readonly uiScene: UiSceneIr;
  readonly debugSummary: GraphqlBijouBlockDebugSummary;
}

export interface VisorReplayStep {
  readonly id: string;
  readonly label: string;
  readonly inputHashes: readonly string[];
  readonly outputHashes: readonly string[];
}

export interface VisorReplayMetadata {
  readonly replayVersion: VisorReplayMetadataVersion;
  readonly scenarioId: string;
  readonly fixtureId: string;
  readonly deterministicSeed: string;
  readonly consumedHashes: {
    readonly sourceHash: string;
    readonly normalizedSourceHash: string;
    readonly artifactHash: string;
    readonly sceneHash: string;
    readonly debugSummaryHash: string;
    readonly visualFactsHash: string;
  };
  readonly steps: readonly VisorReplayStep[];
}

export interface VisorVisualNodeFact {
  readonly nodeId: string;
  readonly kind: UiNodeKind;
  readonly role?: string;
  readonly component?: string;
  readonly parentId?: string;
  readonly childNodeIds: readonly string[];
  readonly text?: UiTextRef;
  readonly i18nKeys: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly bindingIds: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface VisorVisualLowerModeFact {
  readonly mode: UiSceneLowerMode;
  readonly surfaceHash: string;
  readonly rowsHash: string;
}

export interface VisorVisualSceneFacts {
  readonly visualFactsVersion: VisorVisualSceneFactsVersion;
  readonly sceneId: string;
  readonly rootNodeId: string;
  readonly targetProfiles: readonly UiTargetProfile[];
  readonly nodeFacts: readonly VisorVisualNodeFact[];
  readonly lowerModes: readonly VisorVisualLowerModeFact[];
}

export interface VisorArtifactBundleHashes {
  readonly sourceHash: string;
  readonly normalizedSourceHash: string;
  readonly artifactHash: string;
  readonly sceneHash: string;
  readonly debugSummaryHash: string;
  readonly replayHash: string;
  readonly visualFactsHash: string;
  readonly bundleHash: string;
}

export interface VisorArtifactBundleReceipt {
  readonly subject: string;
  readonly version: string;
  readonly hash: string;
}

export interface VisorArtifactBundle {
  readonly bundleVersion: VisorArtifactBundleVersion;
  readonly fixture: VisorArtifactBundleFixture;
  readonly source: VisorArtifactBundleSource;
  readonly artifacts: VisorArtifactBundleArtifacts;
  readonly replay: VisorReplayMetadata;
  readonly visual: VisorVisualSceneFacts;
  readonly hashes: VisorArtifactBundleHashes;
  readonly receipts: readonly VisorArtifactBundleReceipt[];
}

export type VisorArtifactBundleHashBody = Omit<VisorArtifactBundleHashes, 'bundleHash'>;

export type VisorArtifactBundleWithoutHash = Omit<VisorArtifactBundle, 'hashes'> & {
  readonly hashes: VisorArtifactBundleHashBody & {
    readonly bundleHash?: string;
  };
};
