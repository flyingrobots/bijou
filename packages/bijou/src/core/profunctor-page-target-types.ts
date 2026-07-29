import type { Surface } from '../ports/surface.js';
import type {
  UiCellSourceMapEntry,
  UiSceneIr,
  UiSceneTerminalProof,
} from './ui-scene-ir.js';

export type ProfunctorPageInspectionMode =
  | 'normal'
  | 'node-ids'
  | 'source-refs'
  | 'token-refs'
  | 'composition'
  | 'obstructions';

export interface ProfunctorPageTargetEntry {
  readonly pageNodeId: string;
  readonly templateNodeId: string;
  readonly contentNodeId: string | null;
  readonly blockDefinitionId: string;
  readonly renderNodeId: string | null;
  readonly region: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } | null;
  readonly residual: {
    readonly kind: 'hidden-node' | 'hidden-unsupported-block';
    readonly blockDefinitionId: string;
  } | null;
  readonly sourceRefs: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly requiredCapabilities: readonly string[];
}

export interface ProfunctorPageActionFact {
  readonly actionId: string;
  readonly pageNodeId: string;
  readonly label: string;
  readonly target: string;
}

export interface ProfunctorPageCapabilityOutcome {
  readonly capability: string;
  readonly disposition: 'structural-fact' | 'action-adapter' | 'residual';
  readonly detail: string;
}

export interface ProfunctorPageTargetMap {
  readonly artifactVersion: 'bijou-profunctor-page-map/1';
  readonly pageId: string;
  readonly compositionRef: string;
  readonly overrideRefs: readonly string[];
  readonly route: string;
  readonly sceneId: string;
  readonly targetProfile: 'bijou-terminal-project-page/1';
  readonly entries: readonly ProfunctorPageTargetEntry[];
  readonly readingOrder: readonly string[];
  readonly outline: readonly {
    readonly level: number;
    readonly pageNodeId: string;
    readonly text: string;
  }[];
  readonly landmarks: readonly {
    readonly pageNodeId: string;
    readonly role: string;
  }[];
  readonly tokenRefs: readonly string[];
  readonly sourceOccurrences: readonly string[];
  readonly actions: readonly ProfunctorPageActionFact[];
  readonly capabilityOutcomes: readonly ProfunctorPageCapabilityOutcome[];
  readonly cellSourceMap: readonly UiCellSourceMapEntry[];
}

export interface ProfunctorPageTargetReceipt {
  readonly artifactVersion: 'bijou-profunctor-page-receipt/1';
  readonly pageId: string;
  readonly route: string;
  readonly mode: ProfunctorPageInspectionMode;
  readonly inputDigests: Readonly<Record<string, string>>;
  readonly outputDigests: Readonly<Record<string, string>>;
  readonly upstreamClaims: readonly string[];
  readonly upstreamClaimsInherited: false;
  readonly capabilityOutcomes: readonly ProfunctorPageCapabilityOutcome[];
}

export interface ProfunctorPageOutputArtifact {
  readonly filename: string;
  readonly source: string;
}

export interface ProfunctorPageTargetProof {
  readonly scene: UiSceneIr;
  readonly targetMap: ProfunctorPageTargetMap;
  readonly terminalProof: UiSceneTerminalProof;
  readonly surface: Surface;
  readonly receipt: ProfunctorPageTargetReceipt;
  readonly witness: string;
  readonly artifacts: {
    readonly scene: ProfunctorPageOutputArtifact;
    readonly targetMap: ProfunctorPageOutputArtifact;
    readonly receipt: ProfunctorPageOutputArtifact;
    readonly witness: ProfunctorPageOutputArtifact;
  };
}

export interface ProfunctorPageTargetOptions {
  readonly mode?: ProfunctorPageInspectionMode;
}
