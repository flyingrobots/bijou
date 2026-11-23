import type {
  UiSceneBrowserLowering,
  UiSceneBrowserLoweringOptions,
} from './ui-scene-browser-contract.js';
import { lowerUiSceneToBrowser } from './ui-scene-browser-lowering.js';
import { hashUiSceneValue } from './ui-scene-canonical.js';
import type { UiSceneIr } from './ui-scene-contract.js';
import {
  createUiSceneReceipt,
  type UiSceneReceipt,
} from './ui-scene-receipt.js';

export interface UiSceneBrowserProof {
  readonly lowering: UiSceneBrowserLowering;
  readonly receipt: UiSceneReceipt;
}

/**
 * Records a browser lowering in a `ui-scene-receipt/1`. `endpointHash` covers
 * the endpoint version and target profile; `witnessHash` covers the markup.
 */
export function createUiSceneBrowserReceipt(
  scene: UiSceneIr,
  lowering: UiSceneBrowserLowering,
): UiSceneReceipt {
  if (lowering.sceneHash !== hashUiSceneValue(scene)) {
    throw new Error(
      'Browser lowering was created for a different ui-scene-ir/1 scene.',
    );
  }
  return createUiSceneReceipt(scene, {
    browser: {
      endpointHash: hashUiSceneValue({
        endpoint: lowering.endpoint,
        targetProfile: lowering.targetProfile,
      }),
      witnessHash: lowering.markupHash,
    },
  });
}

export function lowerUiSceneToBrowserProof(
  scene: UiSceneIr,
  options: UiSceneBrowserLoweringOptions = {},
): UiSceneBrowserProof {
  const lowering = lowerUiSceneToBrowser(scene, options);
  return {
    lowering,
    receipt: createUiSceneBrowserReceipt(scene, lowering),
  };
}
