import { capabilityOutcomes } from './profunctor-page-capabilities.js';
import { collectPageActions } from './profunctor-page-actions.js';
import {
  failPageTarget,
  ProfunctorPageTargetError,
} from './profunctor-page-error.js';
import { createProfunctorPageTargetMap } from './profunctor-page-map.js';
import type { ProfunctorArtifactInputs } from './profunctor-page-model.js';
import {
  assertSceneBytes,
  createTargetReceipt,
  jsonArtifact,
  surfaceWitness,
  textArtifact,
} from './profunctor-page-output.js';
import { parseProfunctorArtifactFamily } from './profunctor-page-parse.js';
import { buildProfunctorPageScene } from './profunctor-page-scene.js';
import type {
  ProfunctorPageInspectionMode,
  ProfunctorPageTargetOptions,
  ProfunctorPageTargetProof,
} from './profunctor-page-target-types.js';
import {
  lowerUiSceneToTerminalProof,
} from './ui-scene-ir.js';
import { validateProfunctorArtifactFamily } from './profunctor-page-validate-family.js';

export { ProfunctorPageTargetError };
export type {
  ProfunctorArtifactInput,
  ProfunctorArtifactInputs,
} from './profunctor-page-model.js';
export type {
  ProfunctorPageInspectionMode,
  ProfunctorPageTargetEntry,
  ProfunctorPageTargetMap,
  ProfunctorPageTargetOptions,
  ProfunctorPageTargetProof,
  ProfunctorPageTargetReceipt,
} from './profunctor-page-target-types.js';

export function lowerProfunctorPageArtifacts(
  inputs: ProfunctorArtifactInputs,
  options: ProfunctorPageTargetOptions = {},
): ProfunctorPageTargetProof {
  try {
    const mode = inspectionMode(options);
    const family = parseProfunctorArtifactFamily(inputs);
    validateProfunctorArtifactFamily(family);
    const outcomes = capabilityOutcomes(family.page.capabilityRequirements);
    const actions = collectPageActions(family.page);
    const build = buildProfunctorPageScene(
      family.page,
      family.inputDigests.page,
      actions,
      outcomes,
      mode,
    );
    const terminalProof = lowerUiSceneToTerminalProof(build.scene);
    const targetMap = createProfunctorPageTargetMap(
      family.page,
      family.sourceMap,
      build.scene.id,
      build.regions,
      actions,
      outcomes,
      terminalProof.lowering.cellSourceMap,
    );
    const sceneArtifact = jsonArtifact('page.bijou.scene.json', build.scene);
    const mapArtifact = jsonArtifact('page.bijou.map.json', targetMap);
    const witness = surfaceWitness(terminalProof.lowering.surface);
    const witnessArtifact = textArtifact('page.bijou.txt', witness);
    const receipt = createTargetReceipt({
      family,
      mode,
      scene: sceneArtifact,
      targetMap: mapArtifact,
      targetMapValue: targetMap,
      terminalProof,
      witness: witnessArtifact,
    });
    const receiptArtifact = jsonArtifact('page.bijou.receipt.json', receipt);
    assertSceneBytes(sceneArtifact, build.scene);
    return {
      scene: build.scene,
      targetMap,
      terminalProof,
      surface: terminalProof.lowering.surface,
      receipt,
      witness,
      artifacts: {
        scene: sceneArtifact,
        targetMap: mapArtifact,
        receipt: receiptArtifact,
        witness: witnessArtifact,
      },
    };
  } catch (error) {
    if (error instanceof ProfunctorPageTargetError) {
      throw error;
    }
    failPageTarget(
      'BIJOU_PAGE_OUTPUT_INVALID',
      'bijou-profunctor-page-target',
      error instanceof Error ? error.message : String(error),
      error,
    );
  }
}

function inspectionMode(options: unknown): ProfunctorPageInspectionMode {
  if (
    typeof options !== 'object'
    || options === null
    || Array.isArray(options)
  ) {
    invalidMode('expected options object');
  }
  const keys = Object.keys(options);
  const unowned = keys.find((key) => key !== 'mode');
  if (unowned !== undefined) {
    failPageTarget(
      'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
      `options.${unowned}`,
      'field is not owned by this contract',
    );
  }
  const mode = 'mode' in options ? options.mode : undefined;
  switch (mode) {
    case undefined:
    case 'normal':
      return 'normal';
    case 'node-ids':
    case 'source-refs':
    case 'token-refs':
    case 'composition':
    case 'obstructions':
      return mode;
    default:
      invalidMode('unsupported Profunctor Page inspection mode');
  }
}

function invalidMode(detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', 'options.mode', detail);
}
