import { describe, expect, it } from 'vitest';
import {
  compileGraphqlBijouBlock,
  createGraphqlBijouBlockDebugSummary,
  createVisorArtifactBundle,
  createVisorArtifactBundleFromGraphql,
  lowerBijouBlockToUiScene,
} from '@flyingrobots/bijou';
import {
  buildNavigationBundle,
  FIXTURE_ID,
  FIXTURE_PATH,
  navigationSource,
  NAV_TOKEN_COLORS,
} from './visor-artifact-bundle.test-support.js';

describe('DX-049 visor-artifact-bundle/1', () => {
  it('exposes replay identity and visual scene facts without host-local state', () => {
    const bundle = buildNavigationBundle();

    expect(bundle.replay).toMatchObject({
      replayVersion: 'visor-replay-metadata/1',
      scenarioId: `${FIXTURE_ID}:graphql-to-ui-scene`,
      fixtureId: FIXTURE_ID,
      deterministicSeed: 'no-randomness',
      consumedHashes: {
        artifactHash: bundle.hashes.artifactHash,
        sceneHash: bundle.hashes.sceneHash,
        debugSummaryHash: bundle.hashes.debugSummaryHash,
        visualFactsHash: bundle.hashes.visualFactsHash,
      },
    });
    expect(bundle.replay.steps.map((step) => step.id)).toEqual([
      'compile-graphql-bijou-block',
      'lower-bijou-block-to-ui-scene',
      'summarize-graphql-bijou-block-debug',
      'extract-visual-scene-facts',
    ]);
    expect(JSON.stringify(bundle.replay)).not.toMatch(/\/Users\/|[A-Za-z]:\\|pid|timestamp|terminalDimensions/);

    expect(bundle.visual).toMatchObject({
      visualFactsVersion: 'visor-visual-scene-facts/1',
      sceneId: 'dogfood.navigation',
      rootNodeId: 'dogfood.navigation.root',
      targetProfiles: [{ kind: 'bijou-terminal', cols: 80, rows: 8 }],
    });
    expect(bundle.visual.nodeFacts.find((fact) => fact.nodeId === 'dogfood.navigation.active')).toMatchObject({
      nodeId: 'dogfood.navigation.active',
      kind: 'text',
      i18nKeys: ['dogfood.navigation.active'],
      tokenRefs: ['semantic.nav.item.active.bg', 'semantic.nav.item.active.fg'],
      actionIds: ['navigation.selectItem'],
      bindingIds: ['navigation.selection.activeLabel'],
      sourceRefs: [`${FIXTURE_PATH}#type.DogfoodNavigationList.field.activeItem`],
    });
    expect(bundle.visual.lowerModes.map((mode) => mode.mode)).toEqual([
      'normal',
      'node-ids',
      'i18n-keys',
      'token-refs',
    ]);
  });

  it('rejects invalid identity, source, duplicate node, and hash facts', () => {
    const source = navigationSource();

    expect(() => createVisorArtifactBundleFromGraphql(source, {
      fixtureId: '',
      sourceName: FIXTURE_PATH,
    })).toThrow('visor-artifact-bundle/1 fixtureId cannot be empty.');
    expect(() => createVisorArtifactBundleFromGraphql(source, {
      fixtureId: FIXTURE_ID,
      sourceName: '/tmp/navigation-list.graphql',
    })).toThrow('GraphQL Bijou block sourceName must be a relative or logical name.');
    expect(() => createVisorArtifactBundleFromGraphql(
      source.replace('\n    @bijouI18n(key: "dogfood.navigation.itemCount", fallback: "Items: 7")', ''),
      {
        fixtureId: FIXTURE_ID,
        sourceName: FIXTURE_PATH,
      },
    )).toThrow('GraphQL Bijou block field itemCount must include @bijouI18n(...).');

    const artifact = compileGraphqlBijouBlock(source, { sourceName: FIXTURE_PATH });
    const scene = lowerBijouBlockToUiScene(artifact);
    const debugSummary = createGraphqlBijouBlockDebugSummary(artifact, {
      tokenColors: NAV_TOKEN_COLORS,
    });

    expect(() => createVisorArtifactBundle({
      fixtureId: FIXTURE_ID,
      sourceName: FIXTURE_PATH,
      sourceText: source,
      bijouBlock: artifact,
      uiScene: {
        ...scene,
        nodes: [...scene.nodes, { ...scene.nodes[0], id: 'dogfood.navigation.active' }],
      },
      debugSummary,
      tokenColors: NAV_TOKEN_COLORS,
    })).toThrow('visor-artifact-bundle/1 visual facts contain duplicate node id: dogfood.navigation.active');

    expect(() => createVisorArtifactBundle({
      fixtureId: FIXTURE_ID,
      sourceName: FIXTURE_PATH,
      sourceText: source,
      bijouBlock: {
        ...artifact,
        sourceHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      },
      uiScene: scene,
      debugSummary,
      tokenColors: NAV_TOKEN_COLORS,
    })).toThrow('visor-artifact-bundle/1 ui-scene-ir/1 does not match bijou-block/1.');
  });
});
