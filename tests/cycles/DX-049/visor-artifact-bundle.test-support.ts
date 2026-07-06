import {
  createVisorArtifactBundleFromGraphql,
  hashUiSceneValue,
  type VisorArtifactBundle,
} from '@flyingrobots/bijou';
import { readRepoFile } from '../repo.js';

export const FIXTURE_ID = 'dogfood.navigation.graphql';
export const FIXTURE_PATH = 'examples/docs/fixtures/graphql/navigation-list.graphql';

export const NAV_TOKEN_COLORS = {
  'semantic.nav.hint.fg': '#8aa4ff',
  'semantic.nav.item.active.bg': '#1f2937',
  'semantic.nav.item.active.fg': '#f9fafb',
  'semantic.nav.item.fg': '#d1d5db',
  'semantic.nav.title.fg': '#f7d774',
};

export function navigationSource(): string {
  return readRepoFile(FIXTURE_PATH);
}

export function buildNavigationBundle(source = navigationSource()): VisorArtifactBundle {
  return createVisorArtifactBundleFromGraphql(source, {
    fixtureId: FIXTURE_ID,
    sourceName: FIXTURE_PATH,
    tokenColors: NAV_TOKEN_COLORS,
  });
}

export function expectedSemanticBundleHash(bundle: VisorArtifactBundle): string {
  return hashUiSceneValue({
    ...bundle,
    fixture: {
      ...bundle.fixture,
      sourceHash: undefined,
    },
    source: {
      ...bundle.source,
      text: undefined,
    },
    hashes: {
      ...bundle.hashes,
      sourceHash: undefined,
      bundleHash: undefined,
    },
  });
}
