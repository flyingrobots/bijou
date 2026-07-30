import type {
  UiPortabilityClaim,
  UiTargetProfile,
} from './ui-scene-target-profile.js';

export const UI_SCENE_IR_VERSION = 'ui-scene-ir/1' as const;
export const UI_SCENE_RECEIPT_VERSION = 'ui-scene-receipt/1' as const;

export type UiSceneIrVersion = typeof UI_SCENE_IR_VERSION;
export type UiNodeKind =
  | 'box'
  | 'text'
  | 'image'
  | 'group'
  | 'list'
  | 'table'
  | 'custom'
  | 'markdown';
export type UiTextRef =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'i18n'; readonly key: string; readonly fallback?: string };

export interface UiStyleRef {
  readonly fg?: { readonly token: string };
  readonly bg?: { readonly token: string };
  readonly border?: { readonly token: string };
  readonly modifiers?: readonly string[];
}

export interface UiLayoutIntent {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface UiNode {
  readonly id: string;
  readonly kind: UiNodeKind;
  readonly role?: string;
  readonly component?: string;
  readonly parentId?: string;
  readonly children?: readonly string[];
  readonly layout?: UiLayoutIntent;
  readonly text?: UiTextRef;
  readonly style?: UiStyleRef;
  readonly actions?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UiBinding {
  readonly id: string;
  readonly targetNodeId: string;
  readonly targetProperty: string;
  readonly source: {
    readonly kind: 'state' | 'query' | 'computed';
    readonly path: string;
  };
  readonly when?: string;
}

export interface UiAction {
  readonly id: string;
  readonly label?: UiTextRef;
  readonly command: string;
  readonly keybindings?: readonly string[];
  readonly targetNodeId?: string;
}

export interface UiTokenUse {
  readonly nodeId: string;
  readonly slot: string;
  readonly token: string;
}

export interface UiI18nUse {
  readonly nodeId?: string;
  readonly actionId?: string;
  readonly key: string;
}

export interface UiSourceMapEntry {
  readonly nodeId: string;
  readonly source: string;
}

export interface UiSceneIr {
  readonly irVersion: UiSceneIrVersion;
  readonly id: string;
  readonly sourceHash: string;
  readonly rootNodeId: string;
  readonly nodes: readonly UiNode[];
  readonly bindings: readonly UiBinding[];
  readonly actions: readonly UiAction[];
  readonly tokenUses: readonly UiTokenUse[];
  readonly i18nUses: readonly UiI18nUse[];
  readonly sourceMap: readonly UiSourceMapEntry[];
  readonly targetProfiles: readonly UiTargetProfile[];
  readonly portability?: UiPortabilityClaim;
}

export type UiSceneIssueCode =
  | 'unsupported-ir-version'
  | 'root-node-missing'
  | 'duplicate-node-id'
  | 'duplicate-action-id'
  | 'duplicate-binding-id'
  | 'child-node-missing'
  | 'parent-node-missing'
  | 'node-action-missing'
  | 'action-target-missing'
  | 'binding-target-missing'
  | 'token-node-missing'
  | 'i18n-node-missing'
  | 'i18n-action-missing'
  | 'source-map-node-missing'
  | 'invalid-target-profile';

export interface UiSceneValidationIssue {
  readonly code: UiSceneIssueCode;
  readonly message: string;
  readonly id?: string;
}

export interface UiSceneValidationResult {
  readonly ok: boolean;
  readonly issues: readonly UiSceneValidationIssue[];
}
