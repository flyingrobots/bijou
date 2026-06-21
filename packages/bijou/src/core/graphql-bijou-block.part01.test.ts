import {
  compileGraphqlBijouBlock,
  describe,
  expect,
  hashUiSceneValue,
  it,
  lowerBijouBlockToUiScene,
  lowerUiSceneToTerminalProof,
  releaseTitleSdl,
  releaseTitleSdlWithDifferentWhitespace,
  rowText,
  validateUiSceneIr,
} from './graphql-bijou-block.test-support.js';

import type { UiSceneIr } from './graphql-bijou-block.test-support.js';

describe('GraphQL-authored Bijou block artifacts', () => {
it('compiles constrained GraphQL SDL into a terminal scene proof', () => {
    const artifact = compileGraphqlBijouBlock(releaseTitleSdl, {
      sourceName: 'release-title.graphql',
    });
    const sourceHashMatcher: unknown = expect.stringMatching(/^sha256:[0-9a-f]{64}$/);
    expect(artifact).toMatchObject({
      artifactVersion: 'bijou-block/1',
      id: 'release.title',
      component: 'ReleaseTitleBlock',
      rootNodeId: 'release.title.root',
      sourceHash: sourceHashMatcher,
      fields: [
        {
          fieldName: 'heading',
          nodeId: 'heading',
          source: 'release-title.graphql#type.ReleaseTitle.field.heading',
          text: { kind: 'i18n', key: 'release.title.heading', fallback: 'Bijou' },
          style: { fg: { token: 'semantic.title.fg' } },
        },
        {
          fieldName: 'openNotes',
          nodeId: 'open-notes',
          action: {
            id: 'release.openNotes',
            command: 'release.openNotes',
            keybindings: ['Enter'],
          },
          source: 'release-title.graphql#type.ReleaseTitle.field.openNotes',
          text: {
            kind: 'i18n',
            key: 'release.title.openNotes',
            fallback: 'Open release notes',
          },
          style: {
            fg: { token: 'semantic.action.fg' },
            bg: { token: 'semantic.action.bg' },
          },
        },
      ],
      targetProfiles: [{ kind: 'bijou-terminal', cols: 40, rows: 5 }],
    });
    const scene = lowerBijouBlockToUiScene(artifact);
    expect(validateUiSceneIr(scene)).toEqual({ ok: true, issues: [] });
    expect(scene).toMatchObject<Partial<UiSceneIr>>({
      irVersion: 'ui-scene-ir/1',
      id: 'release.title',
      sourceHash: artifact.sourceHash,
      rootNodeId: 'release.title.root',
      portability: { level: 'portable' },
    });
    expect(scene.nodes.map((node) => node.id)).toEqual([
      'release.title.root',
      'heading',
      'open-notes',
    ]);
    expect(scene.actions).toEqual([
      {
        id: 'release.openNotes',
        command: 'release.openNotes',
        keybindings: ['Enter'],
        label: {
          kind: 'i18n',
          key: 'release.title.openNotes',
          fallback: 'Open release notes',
        },
        targetNodeId: 'open-notes',
      },
    ]);
    const proof = lowerUiSceneToTerminalProof(scene, {
      tokenColors: {
        'semantic.action.bg': '#1f2937',
        'semantic.action.fg': '#f9fafb',
        'semantic.title.fg': '#f7d774',
      },
    });
    expect(rowText(proof.lowering.surface, 1)).toContain('Bijou');
    expect(rowText(proof.lowering.surface, 3)).toContain('Open release notes');
    expect(proof.lowering.cellSourceMap.find((entry) => entry.nodeId === 'open-notes')).toMatchObject({
      nodeId: 'open-notes',
      source: 'release-title.graphql#type.ReleaseTitle.field.openNotes',
      textKey: 'release.title.openNotes',
      fgToken: 'semantic.action.fg',
      bgToken: 'semantic.action.bg',
    });
    expect(proof.receipt.sceneHash).toBe(hashUiSceneValue(scene));
    expect(proof.receipt.i18nKeys).toEqual([
      'release.title.heading',
      'release.title.openNotes',
    ]);
    expect(proof.receipt.tokenRefs).toEqual([
      'semantic.action.bg',
      'semantic.action.fg',
      'semantic.title.fg',
    ]);
  });
});

describe('GraphQL-authored Bijou block artifacts', () => {
it('keeps semantic artifact and scene hashes stable across whitespace-only SDL variants', () => {
    const one = compileGraphqlBijouBlock(releaseTitleSdl, {
      sourceName: 'release-title.graphql',
    });
    const two = compileGraphqlBijouBlock(releaseTitleSdlWithDifferentWhitespace, {
      sourceName: 'release-title.graphql',
    });
    expect(one.sourceHash).toBe(two.sourceHash);
    expect(hashUiSceneValue(one)).toBe(hashUiSceneValue(two));
    expect(hashUiSceneValue(lowerBijouBlockToUiScene(one))).toBe(hashUiSceneValue(lowerBijouBlockToUiScene(two)));
  });
});
