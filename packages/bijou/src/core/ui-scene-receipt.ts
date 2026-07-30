import {
  UI_SCENE_RECEIPT_VERSION,
  type UiNode,
  type UiSceneIr,
} from './ui-scene-contract.js';
import { hashUiSceneValue, sortedUnique } from './ui-scene-canonical.js';

export type UiSceneReceiptVersion = typeof UI_SCENE_RECEIPT_VERSION;

export interface UiSceneReceipt {
  readonly receiptVersion: UiSceneReceiptVersion;
  readonly sceneHash: string;
  readonly sourceHash: string;
  readonly nodeIds: readonly string[];
  readonly componentIds: readonly string[];
  readonly i18nKeys: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly bindingIds: readonly string[];
  readonly outputs: {
    readonly terminal?: {
      readonly layoutHash: string;
      readonly surfaceHash: string;
    };
    readonly browser?: {
      readonly endpointHash: string;
      readonly witnessHash: string;
    };
    readonly packedCells?: {
      readonly targetHash: string;
      readonly surfaceHash: string;
    };
  };
}

export function createUiSceneReceipt(
  scene: UiSceneIr,
  outputs: UiSceneReceipt['outputs'] = {},
): UiSceneReceipt {
  return {
    receiptVersion: UI_SCENE_RECEIPT_VERSION,
    sceneHash: hashUiSceneValue(scene),
    sourceHash: scene.sourceHash,
    nodeIds: sortedUnique(scene.nodes.map((node) => node.id)),
    componentIds: sortedUnique(
      scene.nodes.flatMap((node) =>
        node.component == null ? [] : [node.component],
      ),
    ),
    i18nKeys: sceneI18nKeys(scene),
    tokenRefs: sceneTokenRefs(scene),
    actionIds: sortedUnique(scene.actions.map((action) => action.id)),
    bindingIds: sortedUnique(scene.bindings.map((binding) => binding.id)),
    outputs,
  };
}

function sceneI18nKeys(scene: UiSceneIr): readonly string[] {
  return sortedUnique([
    ...scene.i18nUses.map((use) => use.key),
    ...scene.nodes.flatMap((node) =>
      node.text?.kind === 'i18n' ? [node.text.key] : [],
    ),
    ...scene.actions.flatMap((action) =>
      action.label?.kind === 'i18n' ? [action.label.key] : [],
    ),
  ]);
}

function sceneTokenRefs(scene: UiSceneIr): readonly string[] {
  return sortedUnique([
    ...scene.tokenUses.map((use) => use.token),
    ...scene.nodes.flatMap(nodeStyleTokenRefs),
  ]);
}

function nodeStyleTokenRefs(node: UiNode): readonly string[] {
  return [
    node.style?.fg?.token,
    node.style?.bg?.token,
    node.style?.border?.token,
  ].filter((token): token is string => token != null);
}
