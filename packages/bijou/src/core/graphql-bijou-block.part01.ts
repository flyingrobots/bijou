import type { UiLayoutIntent, UiSceneLowerMode, UiSourceMapEntry, UiStyleRef, UiTargetProfile, UiTextRef } from './ui-scene-ir.js';

import type { ParsedDirective, ParsedField } from './graphql-bijou-block.part02.js';
export const BIJOU_BLOCK_ARTIFACT_VERSION = 'bijou-block/1' as const;
export const GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION = 'graphql-bijou-block-debug/1' as const;
export type BijouBlockArtifactVersion = typeof BIJOU_BLOCK_ARTIFACT_VERSION;
export type GraphqlBijouBlockDebugSummaryVersion = typeof GRAPHQL_BIJOU_BLOCK_DEBUG_SUMMARY_VERSION;
export interface CompileGraphqlBijouBlockOptions {
  readonly sourceName?: string;
}
export interface BijouBlockFieldAction {
  readonly id: string;
  readonly command: string;
  readonly keybindings: readonly string[];
}
export interface BijouBlockFieldBinding {
  readonly id: string;
  readonly targetProperty: string;
  readonly source: {
    readonly kind: 'state' | 'query' | 'computed';
    readonly path: string;
  };
  readonly when?: string;
}
export interface BijouBlockGroup {
  readonly id: string;
  readonly label?: string;
  readonly source: string;
  readonly layout: UiLayoutIntent;
}
export interface BijouBlockField {
  readonly fieldName: string;
  readonly nodeId: string;
  readonly groupId?: string;
  readonly graphqlType: string;
  readonly source: string;
  readonly layout: UiLayoutIntent;
  readonly text: UiTextRef;
  readonly style?: UiStyleRef;
  readonly action?: BijouBlockFieldAction;
  readonly binding?: BijouBlockFieldBinding;
}
export interface BijouBlockArtifact {
  readonly artifactVersion: BijouBlockArtifactVersion;
  readonly id: string;
  readonly component: string;
  readonly sourceTypeName: string;
  readonly sourceName: string;
  readonly sourceHash: string;
  readonly rootNodeId: string;
  readonly groups: readonly BijouBlockGroup[];
  readonly fields: readonly BijouBlockField[];
  readonly targetProfiles: readonly UiTargetProfile[];
}
export interface GraphqlBijouBlockDebugGroupFact {
  readonly id: string;
  readonly label?: string;
  readonly source: string;
  readonly childNodeIds: readonly string[];
}
export interface GraphqlBijouBlockDebugFieldFact {
  readonly fieldName: string;
  readonly nodeId: string;
  readonly groupId?: string;
  readonly source: string;
  readonly i18nKey?: string;
  readonly tokenRefs: readonly string[];
  readonly actionId?: string;
  readonly bindingId?: string;
}
export interface GraphqlBijouBlockDebugLowerModeFact {
  readonly mode: UiSceneLowerMode;
  readonly surfaceHash: string;
  readonly rows: readonly string[];
}
export interface GraphqlBijouBlockDebugSummary {
  readonly summaryVersion: GraphqlBijouBlockDebugSummaryVersion;
  readonly artifactVersion: BijouBlockArtifactVersion;
  readonly artifactId: string;
  readonly artifactHash: string;
  readonly sceneHash: string;
  readonly summaryHash: string;
  readonly rootNodeId: string;
  readonly groups: readonly GraphqlBijouBlockDebugGroupFact[];
  readonly fields: readonly GraphqlBijouBlockDebugFieldFact[];
  readonly sourceMap: readonly UiSourceMapEntry[];
  readonly i18nKeys: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly bindingIds: readonly string[];
  readonly lowerModes: readonly GraphqlBijouBlockDebugLowerModeFact[];
}
export interface ParsedGraphqlBijouBlock {
  readonly typeName: string;
  readonly typeDirectives: readonly ParsedDirective[];
  readonly fields: readonly ParsedField[];
}
