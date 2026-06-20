import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type {
  DogfoodDocsSurfaceBlockConfig,
  DogfoodDocsSurfaceProofArtifact,
  DogfoodDocsSurfaceSchemaData,
} from './dogfood-block-docs-surface-types.js';

export function renderDogfoodDocsSurfaceBlock(
  input: BlockRenderInput<DogfoodDocsSurfaceBlockConfig>,
): BlockRenderResult<string> {
  const config = normalizeDogfoodDocsSurfaceConfig(input.config);
  const routeLabel = config.selectedRouteLabel ?? config.selectedRoute;
  const proofLabel = dogfoodDocsSurfaceProofLabel(config.proofArtifacts);
  const proofIds = dogfoodDocsSurfaceProofIds(config.proofArtifacts);
  const facts = dogfoodDocsSurfaceFacts(config);

  if (input.mode === 'pipe') {
    return {
      output: [
        'route\theading\tsearch-hit-count\tproofs',
        `${config.selectedRoute}\t${config.selectedHeadingId}\t${s(config.searchState.hitCount)}\t${proofIds}`,
      ].join('\n'),
      facts,
    };
  }

  if (input.mode === 'accessible') {
    return {
      output: [
        `DOGFOOD docs surface. ${routeLabel} page selected.`,
        `Reader heading ${config.selectedHeadingId}.`,
        `Search query ${config.searchState.query || 'empty'} has ${s(config.searchState.hitCount)} hits.`,
        `Proof artifacts: ${proofLabel}.`,
      ].join(' '),
      facts,
    };
  }

  return {
    output: [
      '+-- DOGFOOD Docs Surface ------------------------------------------+',
      '| navigation             | reader                                  |',
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceSelectedNavLabel(config), 22)} | ${dogfoodDocsSurfaceCell(`# ${routeLabel}`, 39)} |`,
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceNavLabel(config, 1), 22)} | ${dogfoodDocsSurfaceCell('Blocks are reusable contracts...', 39)} |`,
      `| ${dogfoodDocsSurfaceCell(dogfoodDocsSurfaceNavLabel(config, 2), 22)} | ${dogfoodDocsSurfaceCell('', 39)} |`,
      '|------------------------+-----------------------------------------|',
      `| ${dogfoodDocsSurfaceCell(`search: ${config.searchState.query || 'empty'} (${s(config.searchState.hitCount)} hits)`, 22)} | ${dogfoodDocsSurfaceCell(`proof: ${dogfoodDocsSurfaceProofStatus(config.proofArtifacts)}`, 39)} |`,
      '+------------------------------------------------------------------+',
      'Intents: docs.navigate; docs.search; docs.openProof; docs.copyLink',
    ].join('\n'),
    facts,
  };
}

function normalizeDogfoodDocsSurfaceConfig(
  config: DogfoodDocsSurfaceBlockConfig | undefined,
): DogfoodDocsSurfaceSchemaData {
  const selectedRoute = config?.selectedRoute ?? 'docs';
  const selectedHeadingId = config?.selectedHeadingId ?? selectedRoute;
  return {
    docsTree: config?.docsTree ?? [],
    selectedRoute,
    ...(config?.selectedRouteLabel === undefined ? {} : { selectedRouteLabel: config.selectedRouteLabel }),
    selectedHeadingId,
    searchState: config?.searchState ?? { query: '', hitCount: 0 },
    proofArtifacts: config?.proofArtifacts ?? [],
  };
}

export function dogfoodDocsSurfaceFacts(
  config: DogfoodDocsSurfaceBlockConfig,
) {
  const normalized = normalizeDogfoodDocsSurfaceConfig(config);
  return [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' },
    { kind: 'entity' as const, key: 'route', value: normalized.selectedRoute },
    { kind: 'entity' as const, key: 'heading-id', value: normalized.selectedHeadingId },
    { kind: 'count' as const, key: 'search-hit-count', value: normalized.searchState.hitCount },
    ...dogfoodDocsSurfaceProofFacts(normalized.proofArtifacts),
  ];
}

function dogfoodDocsSurfaceProofIds(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
): string {
  const available = artifacts
    .filter((artifact) => artifact.available)
    .map((artifact) => artifact.id);
  return available.length === 0 ? 'none' : available.join(', ');
}

function dogfoodDocsSurfaceProofFacts(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
) {
  const available = artifacts.filter((artifact) => artifact.available);
  return available.length === 0
    ? [{ kind: 'entity' as const, key: 'proof-artifact', value: 'none' }]
    : available.map((artifact) => ({
      kind: 'entity' as const,
      key: 'proof-artifact',
      value: artifact.id,
    }));
}

function dogfoodDocsSurfaceProofLabel(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
): string {
  const available = artifacts
    .filter((artifact) => artifact.available)
    .map((artifact) => artifact.label);
  return available.length === 0 ? 'none' : available.join(', ');
}

function dogfoodDocsSurfaceProofStatus(
  artifacts: readonly DogfoodDocsSurfaceProofArtifact[],
): string {
  const label = dogfoodDocsSurfaceProofLabel(artifacts);
  return label === 'none' ? 'none' : `${label} available`;
}

function dogfoodDocsSurfaceSelectedNavLabel(config: DogfoodDocsSurfaceSchemaData): string {
  const selectedLabel = config.selectedRouteLabel ?? config.selectedRoute;
  return `> ${selectedLabel}`;
}

function dogfoodDocsSurfaceCell(value: string, width: number): string {
  return value.slice(0, width).padEnd(width);
}

function dogfoodDocsSurfaceNavLabel(
  config: DogfoodDocsSurfaceSchemaData,
  index: number,
): string {
  const selectedLabel = config.selectedRouteLabel ?? config.selectedRoute;
  const remainingLabels = config.docsTree.filter((label) => label !== selectedLabel);
  const label = remainingLabels[index - 1] ?? '';
  if (label.length === 0) {
    return '';
  }

  return `  ${label}`;
}
