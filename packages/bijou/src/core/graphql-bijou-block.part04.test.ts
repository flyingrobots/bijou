import {
  compileGraphqlBijouBlock,
  createGraphqlBijouBlockDebugSummary,
  describe,
  expect,
  hashUiSceneValue,
  it,
  lowerBijouBlockToUiScene,
  releaseCardSdl,
  releaseCardSdlWithDifferentWhitespace,
} from './graphql-bijou-block.test-support.js';

describe('GraphQL-authored Bijou block artifacts', () => {
it('emits deterministic debug summary facts for grouped SDL', () => {
    const artifact = compileGraphqlBijouBlock(releaseCardSdl, {
      sourceName: 'release-card.graphql',
    });
    const scene = lowerBijouBlockToUiScene(artifact);
    const summary = createGraphqlBijouBlockDebugSummary(artifact, {
      tokenColors: {
        'semantic.action.bg': '#1f2937',
        'semantic.action.fg': '#f9fafb',
        'semantic.title.fg': '#f7d774',
      },
    });
    expect(summary).toMatchObject({
      summaryVersion: 'graphql-bijou-block-debug/1',
      artifactId: 'release.card',
      artifactHash: hashUiSceneValue(artifact),
      sceneHash: hashUiSceneValue(scene),
      rootNodeId: 'release.card.root',
      groups: [
        {
          id: 'release.card.header',
          childNodeIds: ['heading'],
          source: 'release-card.graphql#type.ReleaseCard.group.release.card.header',
        },
        {
          id: 'release.card.footer',
          childNodeIds: ['open-notes'],
          source: 'release-card.graphql#type.ReleaseCard.group.release.card.footer',
        },
      ],
      fields: [
        {
          nodeId: 'heading',
          groupId: 'release.card.header',
          i18nKey: 'release.card.heading',
          tokenRefs: ['semantic.title.fg'],
        },
        {
          nodeId: 'open-notes',
          groupId: 'release.card.footer',
          actionId: 'release.openNotes',
          bindingId: 'release.openNotes.label',
          i18nKey: 'release.card.openNotes',
          tokenRefs: ['semantic.action.bg', 'semantic.action.fg'],
        },
      ],
      i18nKeys: ['release.card.heading', 'release.card.openNotes'],
      tokenRefs: ['semantic.action.bg', 'semantic.action.fg', 'semantic.title.fg'],
      actionIds: ['release.openNotes'],
      bindingIds: ['release.openNotes.label'],
    });
    expect(summary.summaryHash).toBe(hashUiSceneValue({
      ...summary,
      summaryHash: undefined,
    }));
    expect(summary.lowerModes.map((mode) => mode.mode)).toEqual([
      'normal',
      'node-ids',
      'i18n-keys',
      'token-refs',
    ]);
    expect(summary.lowerModes.every((mode) => /^sha256:[0-9a-f]{64}$/.test(mode.surfaceHash))).toBe(true);
    expect(summary.lowerModes.find((mode) => mode.mode === 'node-ids')?.rows.join('\n')).toContain('open-notes');
    expect(summary.lowerModes.find((mode) => mode.mode === 'i18n-keys')?.rows.join('\n'))
      .toContain('release.card.openNotes');
    expect(summary.lowerModes.find((mode) => mode.mode === 'token-refs')?.rows.join('\n'))
      .toContain('semantic.action.fg semantic.action.bg');
  });
});

describe('GraphQL-authored Bijou block artifacts', () => {
it('keeps grouped artifact, scene, and debug hashes stable across whitespace-only SDL variants', () => {
    const one = compileGraphqlBijouBlock(releaseCardSdl, {
      sourceName: 'release-card.graphql',
    });
    const two = compileGraphqlBijouBlock(releaseCardSdlWithDifferentWhitespace, {
      sourceName: 'release-card.graphql',
    });
    expect(one.sourceHash).toBe(two.sourceHash);
    expect(hashUiSceneValue(one)).toBe(hashUiSceneValue(two));
    expect(hashUiSceneValue(lowerBijouBlockToUiScene(one))).toBe(hashUiSceneValue(lowerBijouBlockToUiScene(two)));
    expect(createGraphqlBijouBlockDebugSummary(one).summaryHash)
      .toBe(createGraphqlBijouBlockDebugSummary(two).summaryHash);
  });
});

describe('GraphQL-authored Bijou block artifacts', () => {
it('rejects duplicate group ids and missing field group references before lowering', () => {
    expect(() => compileGraphqlBijouBlock(`
      type DuplicateGroup
        @bijouBlock(id: "duplicate.group", component: "DuplicateGroupBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 20, rows: 4)
        @bijouGroup(id: "same.group", label: "One")
        @bijouGroup(id: "same.group", label: "Two") {
        one: String
          @bijouText(id: "one", group: "same.group", x: 0, y: 0)
          @bijouI18n(key: "one", fallback: "One")
      }
    `)).toThrow('Duplicate GraphQL Bijou block group id: same.group');
    expect(() => compileGraphqlBijouBlock(`
      type MissingGroup
        @bijouBlock(id: "missing.group", component: "MissingGroupBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 20, rows: 4) {
        one: String
          @bijouText(id: "one", group: "missing.group", x: 0, y: 0)
          @bijouI18n(key: "one", fallback: "One")
      }
    `)).toThrow('GraphQL Bijou block field one references missing group: missing.group');
  });
});
