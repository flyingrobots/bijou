import { describe, expect, it } from 'vitest';
import {
  compileGraphqlBijouBlock,
  lowerBijouBlockToUiScene,
} from './graphql-bijou-block.js';
import {
  hashUiSceneValue,
  lowerUiSceneToTerminalProof,
  validateUiSceneIr,
  type UiSceneIr,
} from './ui-scene-ir.js';

const releaseTitleSdl = `
type ReleaseTitle
  @bijouBlock(id: "release.title", component: "ReleaseTitleBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 40, rows: 5) {
  heading: String!
    @bijouText(id: "heading", x: 2, y: 1)
    @bijouI18n(key: "release.title.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")

  openNotes: String
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouText(id: "open-notes", x: 2, y: 3)
    @bijouI18n(key: "release.title.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
`;

const releaseTitleSdlWithDifferentWhitespace = `
type   ReleaseTitle
  @bijouBlock( id: "release.title", component: "ReleaseTitleBlock" )
  @bijouTarget( kind: "bijou-terminal", cols: 40, rows: 5 ) {
  heading:    String!
    @bijouText( id: "heading", x: 2, y: 1 )
    @bijouI18n( key: "release.title.heading", fallback: "Bijou" )
    @bijouToken( fg: "semantic.title.fg" )

  openNotes: String
    @bijouAction( id: "release.openNotes", command: "release.openNotes", key: "Enter" )
    @bijouText( id: "open-notes", x: 2, y: 3 )
    @bijouI18n( key: "release.title.openNotes", fallback: "Open release notes" )
    @bijouToken( fg: "semantic.action.fg", bg: "semantic.action.bg" )
}
`;

describe('GraphQL-authored Bijou block artifacts', () => {
  it('compiles constrained GraphQL SDL into a terminal scene proof', () => {
    const artifact = compileGraphqlBijouBlock(releaseTitleSdl, {
      sourceName: 'release-title.graphql',
    });

    expect(artifact).toMatchObject({
      artifactVersion: 'bijou-block/1',
      id: 'release.title',
      component: 'ReleaseTitleBlock',
      rootNodeId: 'release.title.root',
      sourceHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
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

  it('parses quoted directive arguments containing closing parentheses', () => {
    const artifact = compileGraphqlBijouBlock(`
      type ParenText
        @bijouBlock(id: "paren.text", component: "ParenTextBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 30, rows: 3) {
        heading: String
          @bijouText(id: "heading", x: 0, y: 0)
          @bijouI18n(key: "heading", fallback: "Open (beta)")
      }
    `);

    expect(artifact.fields[0]?.text).toEqual({
      kind: 'i18n',
      key: 'heading',
      fallback: 'Open (beta)',
    });
    expect(rowText(lowerUiSceneToTerminalProof(lowerBijouBlockToUiScene(artifact)).lowering.surface, 0))
      .toContain('Open (beta)');
  });

  it('fails loudly when the SDL omits the block directive', () => {
    expect(() => compileGraphqlBijouBlock(`
      type MissingBlock {
        heading: String
          @bijouText(id: "heading", x: 0, y: 0)
          @bijouI18n(key: "heading", fallback: "Heading")
      }
    `)).toThrow('GraphQL Bijou block source must include @bijouBlock(id:, component:).');
  });

  it('rejects absolute and UNC source names', () => {
    const backslash = String.fromCharCode(92);
    for (const sourceName of [
      '/tmp/release-title.graphql',
      `C:${backslash}tmp${backslash}release-title.graphql`,
      `${backslash}${backslash}server${backslash}share${backslash}release-title.graphql`,
      '//server/share/release-title.graphql',
    ]) {
      expect(() => compileGraphqlBijouBlock(releaseTitleSdl, { sourceName }))
        .toThrow('GraphQL Bijou block sourceName must be a relative or logical name.');
    }
  });

  it('rejects duplicate scene identities before lowering', () => {
    expect(() => compileGraphqlBijouBlock(`
      type DuplicateNode
        @bijouBlock(id: "duplicate.node", component: "DuplicateNodeBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 20, rows: 4) {
        one: String
          @bijouText(id: "same-node", x: 0, y: 0)
          @bijouI18n(key: "one", fallback: "One")
        two: String
          @bijouText(id: "same-node", x: 0, y: 1)
          @bijouI18n(key: "two", fallback: "Two")
      }
    `)).toThrow('Duplicate GraphQL Bijou block node id: same-node');

    expect(() => compileGraphqlBijouBlock(`
      type DuplicateAction
        @bijouBlock(id: "duplicate.action", component: "DuplicateActionBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 20, rows: 4) {
        one: String
          @bijouText(id: "one", x: 0, y: 0)
          @bijouI18n(key: "one", fallback: "One")
          @bijouAction(id: "same.action", command: "one")
        two: String
          @bijouText(id: "two", x: 0, y: 1)
          @bijouI18n(key: "two", fallback: "Two")
          @bijouAction(id: "same.action", command: "two")
      }
    `)).toThrow('Duplicate GraphQL Bijou block action id: same.action');

    expect(() => compileGraphqlBijouBlock(`
      type DuplicateBinding
        @bijouBlock(id: "duplicate.binding", component: "DuplicateBindingBlock")
        @bijouTarget(kind: "bijou-terminal", cols: 20, rows: 4) {
        one: String
          @bijouText(id: "one", x: 0, y: 0)
          @bijouI18n(key: "one", fallback: "One")
          @bijouBind(id: "same.binding", kind: "state", path: "one")
        two: String
          @bijouText(id: "two", x: 0, y: 1)
          @bijouI18n(key: "two", fallback: "Two")
          @bijouBind(id: "same.binding", kind: "state", path: "two")
      }
    `)).toThrow('Duplicate GraphQL Bijou block binding id: same.binding');

    const validArtifact = compileGraphqlBijouBlock(releaseTitleSdl, {
      sourceName: 'release-title.graphql',
    });
    const invalidArtifact = {
      ...validArtifact,
      fields: [
        ...validArtifact.fields,
        {
          ...validArtifact.fields[0]!,
          fieldName: 'duplicateHeading',
        },
      ],
    };
    expect(() => lowerBijouBlockToUiScene(invalidArtifact))
      .toThrow('Duplicate GraphQL Bijou block node id: heading');
  });
});

function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}
