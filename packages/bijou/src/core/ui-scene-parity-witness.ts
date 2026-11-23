import { lowerUiSceneToBrowser } from './ui-scene-browser-lowering.js';
import type { UiSceneIr } from './ui-scene-contract.js';
import {
  lowerUiSceneToSurface,
  type UiSceneLoweringOptions,
} from './ui-scene-lowering.js';
import { compareUiSceneLowerings } from './ui-scene-parity-compare.js';
import {
  UI_SCENE_PARITY_VERSION,
  type UiSceneParityRefusal,
  type UiSceneParityWitness,
} from './ui-scene-parity-contract.js';

type Attempt<Lowering> =
  | { readonly lowering: Lowering }
  | { readonly refusal: UiSceneParityRefusal };

/**
 * Lowers one `ui-scene-ir/1` scene on the terminal target and on the browser
 * target with the same options, then compares the two outputs. When a target
 * refuses the scene, the witness records each refusal and compares nothing.
 */
export function witnessUiSceneParity(
  scene: UiSceneIr,
  options: UiSceneLoweringOptions = {},
): UiSceneParityWitness {
  const terminal = attempt('terminal', () =>
    lowerUiSceneToSurface(scene, options),
  );
  const browser = attempt('browser', () =>
    lowerUiSceneToBrowser(scene, options),
  );
  if ('lowering' in terminal && 'lowering' in browser) {
    return compareUiSceneLowerings(terminal.lowering, browser.lowering);
  }
  return {
    witnessVersion: UI_SCENE_PARITY_VERSION,
    status: 'refused',
    refusals: [terminal, browser].flatMap((result) =>
      'refusal' in result ? [result.refusal] : [],
    ),
  };
}

function attempt<Lowering>(
  target: UiSceneParityRefusal['target'],
  lower: () => Lowering,
): Attempt<Lowering> {
  try {
    return { lowering: lower() };
  } catch (error) {
    return {
      refusal: {
        target,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
