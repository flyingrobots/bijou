import type { Surface } from '../ports/surface.js';
import { sha256Text } from './sha256-text.js';
import type {
  ProfunctorArtifactFamily,
} from './profunctor-page-model.js';
import type {
  ProfunctorPageInspectionMode,
  ProfunctorPageOutputArtifact,
  ProfunctorPageTargetMap,
  ProfunctorPageTargetReceipt,
} from './profunctor-page-target-types.js';
import type { UiSceneIr, UiSceneTerminalProof } from './ui-scene-ir.js';

export function jsonArtifact(
  filename: string,
  value: unknown,
): ProfunctorPageOutputArtifact {
  return { filename, source: `${JSON.stringify(value)}\n` };
}

export function textArtifact(
  filename: string,
  source: string,
): ProfunctorPageOutputArtifact {
  return { filename, source };
}

export function surfaceWitness(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line.trimEnd());
  }
  while (lines.at(-1) === '') {
    lines.pop();
  }
  return `${lines.join('\n')}\n`;
}

export function createTargetReceipt(input: {
  readonly family: ProfunctorArtifactFamily;
  readonly mode: ProfunctorPageInspectionMode;
  readonly scene: ProfunctorPageOutputArtifact;
  readonly targetMap: ProfunctorPageOutputArtifact;
  readonly targetMapValue: ProfunctorPageTargetMap;
  readonly terminalProof: UiSceneTerminalProof;
  readonly witness: ProfunctorPageOutputArtifact;
}): ProfunctorPageTargetReceipt {
  return {
    artifactVersion: 'bijou-profunctor-page-receipt/1',
    pageId: input.family.page.pageId,
    route: input.family.page.route,
    mode: input.mode,
    inputDigests: input.family.inputDigests,
    outputDigests: {
      scene: sha256Text(input.scene.source),
      targetMap: sha256Text(input.targetMap.source),
      surface: input.terminalProof.lowering.surfaceHash,
      witness: sha256Text(input.witness.source),
    },
    upstreamClaims: input.family.buildManifest.claims,
    upstreamClaimsInherited: false,
    capabilityOutcomes: input.targetMapValue.capabilityOutcomes,
  };
}

export function assertSceneBytes(
  artifact: ProfunctorPageOutputArtifact,
  scene: UiSceneIr,
): void {
  if (artifact.source !== `${JSON.stringify(scene)}\n`) {
    throw new Error('Scene artifact bytes do not match the scene value.');
  }
}
