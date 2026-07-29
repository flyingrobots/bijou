import type {
  ProfunctorArtifactFamily,
  ProfunctorArtifactInputs,
} from './profunctor-page-model.js';
import { parsePageArtifact } from './profunctor-page-parse-page.js';
import {
  parseBuildManifest,
  parsePageSourceMap,
} from './profunctor-page-parse-support.js';
import { sha256Text } from './sha256-text.js';

export function parseProfunctorArtifactFamily(
  inputs: ProfunctorArtifactInputs,
): ProfunctorArtifactFamily {
  return {
    page: parsePageArtifact(inputs.page),
    sourceMap: parsePageSourceMap(inputs.sourceMap),
    buildManifest: parseBuildManifest(inputs.buildManifest),
    inputDigests: {
      page: sha256Text(inputs.page.source),
      sourceMap: sha256Text(inputs.sourceMap.source),
      buildManifest: sha256Text(inputs.buildManifest.source),
    },
  };
}
