import { hashUiSceneValue } from './ui-scene-canonical.js';
import type { UiSceneIr } from './ui-scene-contract.js';
import {
  lowerUiSceneToSurface,
  type UiSceneLoweringOptions,
  type UiSceneSurfaceLowering,
} from './ui-scene-lowering.js';
import {
  createUiSceneReceipt,
  type UiSceneReceipt,
} from './ui-scene-receipt.js';

export interface UiSceneTerminalProof {
  readonly lowering: UiSceneSurfaceLowering;
  readonly receipt: UiSceneReceipt;
}

export function createUiSceneTerminalReceipt(
  scene: UiSceneIr,
  lowering: UiSceneSurfaceLowering,
): UiSceneReceipt {
  const sceneHash = hashUiSceneValue(scene);
  if (lowering.sceneHash !== sceneHash) {
    throw new Error(
      'Terminal lowering was created for a different ui-scene-ir/1 scene.',
    );
  }
  return createUiSceneReceipt(scene, {
    terminal: {
      layoutHash: hashUiSceneValue({
        cellSourceMap: lowering.cellSourceMap,
        targetProfile: lowering.targetProfile,
      }),
      surfaceHash: lowering.surfaceHash,
    },
  });
}

export function lowerUiSceneToTerminalProof(
  scene: UiSceneIr,
  options: UiSceneLoweringOptions = {},
): UiSceneTerminalProof {
  const lowering = lowerUiSceneToSurface(scene, options);
  return {
    lowering,
    receipt: createUiSceneTerminalReceipt(scene, lowering),
  };
}
