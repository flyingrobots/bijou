import type {
  DogfoodDocsSurfaceProofArtifact,
  DogfoodDocsSurfaceSchemaData,
  DogfoodDocsSurfaceSearchState,
} from './dogfood-block-docs-surface-types.js';
import {
  booleanProperty,
  dataArrayValues,
  isPlainRecord,
  nonEmptyTextValue,
  numberProperty,
  ownDataProperty,
  requiredNonEmptyTextProperty,
  textArrayProperty,
  textProperty,
} from './dogfood-block-schema-utils.js';

export function parseDogfoodDocsSurfaceSchemaData(input: unknown): DogfoodDocsSurfaceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const docsTree = textArrayProperty(input, 'docsTree');
  const selectedRoute = requiredNonEmptyTextProperty(input, 'selectedRoute');
  const selectedRouteLabelValue = ownDataProperty(input, 'selectedRouteLabel');
  const selectedRouteLabel = selectedRouteLabelValue === undefined
    ? undefined
    : nonEmptyTextValue(selectedRouteLabelValue);
  const selectedHeadingId = requiredNonEmptyTextProperty(input, 'selectedHeadingId');
  const searchState = parseDogfoodDocsSurfaceSearchState(ownDataProperty(input, 'searchState'));
  const proofArtifacts = parseDogfoodDocsSurfaceProofArtifacts(ownDataProperty(input, 'proofArtifacts'));

  if (
    docsTree === undefined
    || selectedRoute === undefined
    || (selectedRouteLabelValue !== undefined && selectedRouteLabel === undefined)
    || selectedHeadingId === undefined
    || searchState === undefined
    || proofArtifacts === undefined
  ) {
    return undefined;
  }

  return {
    docsTree,
    selectedRoute,
    ...(selectedRouteLabel === undefined ? {} : { selectedRouteLabel }),
    selectedHeadingId,
    searchState,
    proofArtifacts,
  };
}

function parseDogfoodDocsSurfaceSearchState(input: unknown): DogfoodDocsSurfaceSearchState | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const query = textProperty(input, 'query');
  const hitCount = numberProperty(input, 'hitCount');
  if (query === undefined || hitCount === undefined) {
    return undefined;
  }

  return { query, hitCount };
}

function parseDogfoodDocsSurfaceProofArtifacts(
  input: unknown,
): readonly DogfoodDocsSurfaceProofArtifact[] | undefined {
  const values = dataArrayValues(input);
  if (values === undefined) {
    return undefined;
  }

  const artifacts = values.map(parseDogfoodDocsSurfaceProofArtifact);
  return artifacts.every((artifact): artifact is DogfoodDocsSurfaceProofArtifact => artifact !== undefined)
    ? artifacts
    : undefined;
}

function parseDogfoodDocsSurfaceProofArtifact(input: unknown): DogfoodDocsSurfaceProofArtifact | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const id = requiredNonEmptyTextProperty(input, 'id');
  const label = textProperty(input, 'label');
  const available = booleanProperty(input, 'available');
  if (id === undefined || label === undefined || available === undefined) {
    return undefined;
  }

  return { id, label, available };
}
