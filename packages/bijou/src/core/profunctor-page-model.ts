import type { JsonRecord } from './profunctor-page-json-record.js';

export interface ProfunctorArtifactInput {
  readonly filename: string;
  readonly source: string;
}

export interface ProfunctorArtifactInputs {
  readonly page: ProfunctorArtifactInput;
  readonly sourceMap: ProfunctorArtifactInput;
  readonly buildManifest: ProfunctorArtifactInput;
}

export interface ProfunctorPageSlot {
  readonly name: string;
  readonly childPageNodeIds: readonly string[];
}

export interface ProfunctorPageNode {
  readonly blockDefinitionId: string;
  readonly contentNodeId: string | null;
  readonly hidden: boolean;
  readonly pageNodeId: string;
  readonly props: Readonly<JsonRecord>;
  readonly requiredCapabilities: readonly string[];
  readonly slots: readonly ProfunctorPageSlot[];
  readonly sourceBindings: Readonly<Record<string, string>>;
  readonly templateNodeId: string;
  readonly tokens: Readonly<Record<string, string>>;
}

export interface ProfunctorPageArtifact {
  readonly artifactVersion: 'profunctor-page/0';
  readonly capabilityRequirements: readonly string[];
  readonly compositionRef: string;
  readonly contentRefs: readonly string[];
  readonly dependencyDigests: readonly string[];
  readonly entityRef: string;
  readonly landmarks: readonly {
    readonly pageNodeId: string;
    readonly role: string;
  }[];
  readonly nodes: readonly ProfunctorPageNode[];
  readonly outline: readonly {
    readonly level: number;
    readonly pageNodeId: string;
    readonly text: string;
  }[];
  readonly overrideRefs: readonly string[];
  readonly pageId: string;
  readonly publicationRef: string;
  readonly readingOrder: readonly string[];
  readonly rootNodeId: string;
  readonly route: string;
  readonly tokenRefs: readonly string[];
}

export interface ProfunctorSourceMapEntry {
  readonly pageNodeId: string;
  readonly renderNodeId: string | null;
  readonly residual: unknown;
  readonly sourceOccurrenceId: string;
  readonly templateNodeId: string;
  readonly source: Readonly<JsonRecord>;
}

export interface ProfunctorPageSourceMap {
  readonly artifactVersion: 'profunctor-page-source-map/0';
  readonly entries: readonly ProfunctorSourceMapEntry[];
  readonly pageId: string;
}

export interface ProfunctorBuildManifest {
  readonly artifactDigest: string;
  readonly artifactVersion: 'profunctor-build-manifest/0';
  readonly claims: readonly string[];
  readonly dependencies: readonly string[];
  readonly entity: {
    readonly entityDigest: string;
    readonly entityId: string;
  };
  readonly pageId: string;
  readonly routes: readonly string[];
}

export interface ProfunctorArtifactFamily {
  readonly page: ProfunctorPageArtifact;
  readonly sourceMap: ProfunctorPageSourceMap;
  readonly buildManifest: ProfunctorBuildManifest;
  readonly inputDigests: {
    readonly page: string;
    readonly sourceMap: string;
    readonly buildManifest: string;
  };
}
