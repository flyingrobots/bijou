import type {
  PackedBijouCellsChroma,
  PackedBijouCellsFocus,
  PackedBijouCellsScene,
} from './packed-bijou-cells-contract.js';
import {
  validatePackedBijouChroma,
  validatePackedBijouFocus,
} from './packed-bijou-cells-validate-focus.js';
import { validatePackedBijouScene } from './packed-bijou-cells-validate-scene.js';

export interface ValidatedPackedBijouMetadata {
  readonly scene: PackedBijouCellsScene;
  readonly focus: PackedBijouCellsFocus;
  readonly chroma: PackedBijouCellsChroma;
}

export function validatePackedBijouMetadata(
  sceneInput: unknown,
  focusInput: unknown,
  chromaInput: unknown,
  cellCount: number,
): ValidatedPackedBijouMetadata {
  const scene = validatePackedBijouScene(sceneInput, cellCount);
  const nodeIds = new Set(scene.nodeIds);
  return {
    scene,
    focus: validatePackedBijouFocus(focusInput, nodeIds),
    chroma: validatePackedBijouChroma(chromaInput),
  };
}
