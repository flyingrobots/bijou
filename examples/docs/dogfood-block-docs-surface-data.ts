import { commandIntent, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';

export const docsSurfaceTreeRequirement = defineDataRequirement({
  id: 'docs-surface.docsTree',
  resource: 'dogfood.docs.tree',
  label: 'Docs tree',
  description: 'DOGFOOD documentation navigation tree available to the docs surface.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceRouteRequirement = defineDataRequirement({
  id: 'docs-surface.selectedRoute',
  resource: 'dogfood.docs.route',
  label: 'Selected route',
  description: 'Selected DOGFOOD docs route and heading identity.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceSearchRequirement = defineDataRequirement({
  id: 'docs-surface.searchState',
  resource: 'dogfood.docs.search',
  label: 'Search state',
  description: 'DOGFOOD documentation search query and hit count.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const docsSurfaceProofRequirement = defineDataRequirement({
  id: 'docs-surface.proofArtifacts',
  resource: 'dogfood.docs.proofs',
  label: 'Proof artifacts',
  description: 'Capture or proof artifact inventory linked to the selected docs surface.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' }],
});

export const dogfoodDocsSurfaceData = defineViewData({
  id: 'dogfood-docs-surface.data',
  label: 'DogfoodDocsSurfaceBlock data',
  description: 'DOGFOOD docs tree, active route, search posture, and proof artifacts.',
  requirements: [
    { name: 'docsTree', requirement: docsSurfaceTreeRequirement },
    { name: 'selectedRoute', requirement: docsSurfaceRouteRequirement },
    { name: 'searchState', requirement: docsSurfaceSearchRequirement },
    { name: 'proofArtifacts', requirement: docsSurfaceProofRequirement },
  ],
});

export const docsNavigateIntent = commandIntent<{ readonly route: string }>(
  'docs.navigate',
  {
    label: 'Navigate docs',
    description: 'Request navigation to a DOGFOOD documentation route.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsSearchIntent = commandIntent<{ readonly query: string }>(
  'docs.search',
  {
    label: 'Search docs',
    description: 'Request DOGFOOD documentation search for a query.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsOpenProofIntent = commandIntent<{ readonly proofArtifactId: string }>(
  'docs.openProof',
  {
    label: 'Open proof',
    description: 'Request opening a linked DOGFOOD proof artifact.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);

export const docsCopyLinkIntent = commandIntent<{ readonly route: string }>(
  'docs.copyLink',
  {
    label: 'Copy docs link',
    description: 'Request copying a canonical DOGFOOD documentation link.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'DogfoodDocsSurfaceBlock' }],
  },
);
