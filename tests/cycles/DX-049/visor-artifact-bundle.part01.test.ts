import { describe, expect, it } from 'vitest';
import {
  VISOR_ARTIFACT_BUNDLE_VERSION,
  hashUiSceneValue,
} from '@flyingrobots/bijou';
import {
  buildNavigationBundle,
  expectedSemanticBundleHash,
  FIXTURE_ID,
  FIXTURE_PATH,
  navigationSource,
} from './visor-artifact-bundle.test-support.js';

describe('DX-049 visor-artifact-bundle/1', () => {
  it('wraps the DOGFOOD GraphQL fixture, block artifact, scene IR, and debug summary', () => {
    const bundle = buildNavigationBundle(navigationSource());

    expect(bundle.bundleVersion).toBe(VISOR_ARTIFACT_BUNDLE_VERSION);
    expect(bundle.fixture).toMatchObject({
      id: FIXTURE_ID,
      sourceName: FIXTURE_PATH,
    });
    expect(bundle.source).toEqual({
      language: 'graphql',
      text: bundle.source.text,
    });
    expect(bundle.source.text).toContain('type DogfoodNavigationList');
    expect(bundle.artifacts.bijouBlock).toMatchObject({
      artifactVersion: 'bijou-block/1',
      id: 'dogfood.navigation',
      component: 'NavigationListBlock',
      sourceName: FIXTURE_PATH,
    });
    expect(bundle.artifacts.uiScene).toMatchObject({
      irVersion: 'ui-scene-ir/1',
      id: 'dogfood.navigation',
      rootNodeId: 'dogfood.navigation.root',
    });
    expect(bundle.artifacts.debugSummary).toMatchObject({
      summaryVersion: 'graphql-bijou-block-debug/1',
      artifactId: 'dogfood.navigation',
      rootNodeId: 'dogfood.navigation.root',
    });
    expect(bundle.hashes).toMatchObject({
      sourceHash: hashUiSceneValue(bundle.source.text),
      normalizedSourceHash: bundle.fixture.normalizedSourceHash,
      artifactHash: hashUiSceneValue(bundle.artifacts.bijouBlock),
      sceneHash: hashUiSceneValue(bundle.artifacts.uiScene),
      debugSummaryHash: bundle.artifacts.debugSummary.summaryHash,
      replayHash: hashUiSceneValue(bundle.replay),
      visualFactsHash: hashUiSceneValue(bundle.visual),
    });
    expect(bundle.hashes.bundleHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(bundle.hashes.bundleHash).toBe(expectedSemanticBundleHash(bundle));
  });

  it('keeps semantic hashes stable across whitespace-only SDL edits', () => {
    const source = navigationSource();
    const whitespaceOnlyVariant = source
      .replace('type DogfoodNavigationList', 'type   DogfoodNavigationList')
      .replace(
        '@bijouBlock(id: "dogfood.navigation", component: "NavigationListBlock")',
        '@bijouBlock( id: "dogfood.navigation", component: "NavigationListBlock" )',
      )
      .replace(
        '@bijouTarget(kind: "bijou-terminal", cols: 80, rows: 8)',
        '@bijouTarget( kind: "bijou-terminal", cols: 80, rows: 8 )',
      );

    const one = buildNavigationBundle(source);
    const two = buildNavigationBundle(whitespaceOnlyVariant);

    expect(one.hashes.sourceHash).not.toBe(two.hashes.sourceHash);
    expect(one.hashes.normalizedSourceHash).toBe(two.hashes.normalizedSourceHash);
    expect(one.hashes.artifactHash).toBe(two.hashes.artifactHash);
    expect(one.hashes.sceneHash).toBe(two.hashes.sceneHash);
    expect(one.hashes.debugSummaryHash).toBe(two.hashes.debugSummaryHash);
    expect(one.hashes.visualFactsHash).toBe(two.hashes.visualFactsHash);
    expect(one.hashes.replayHash).toBe(two.hashes.replayHash);
    expect(one.hashes.bundleHash).toBe(two.hashes.bundleHash);
  });
});
