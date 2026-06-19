import { describe, expect, it } from 'vitest';
import {
  compileGraphqlBijouBlock,
  createGraphqlBijouBlockDebugSummary,
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
const releaseCardSdl = `
type ReleaseCard
  @bijouBlock(id: "release.card", component: "ReleaseCardBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 48, rows: 8)
  @bijouGroup(id: "release.card.header", label: "Header", x: 1, y: 1, width: 46, height: 3)
  @bijouGroup(id: "release.card.footer", label: "Footer", x: 1, y: 5, width: 46, height: 2) {
  heading: String!
    @bijouText(id: "heading", group: "release.card.header", x: 2, y: 1)
    @bijouI18n(key: "release.card.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")

  openNotes: String
    @bijouText(id: "open-notes", group: "release.card.footer", x: 2, y: 5)
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouBind(id: "release.openNotes.label", kind: "state", path: "release.openNotesLabel")
    @bijouI18n(key: "release.card.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
`;
const releaseCardSdlWithDifferentWhitespace = `
type   ReleaseCard
  @bijouBlock( id: "release.card", component: "ReleaseCardBlock" )
  @bijouTarget( kind: "bijou-terminal", cols: 48, rows: 8 )
  @bijouGroup( id: "release.card.header", label: "Header", x: 1, y: 1, width: 46, height: 3 )
  @bijouGroup( id: "release.card.footer", label: "Footer", x: 1, y: 5, width: 46, height: 2 ) {
  heading:    String!
    @bijouText( id: "heading", group: "release.card.header", x: 2, y: 1 )
    @bijouI18n( key: "release.card.heading", fallback: "Bijou" )
    @bijouToken( fg: "semantic.title.fg" )

  openNotes: String
    @bijouText( id: "open-notes", group: "release.card.footer", x: 2, y: 5 )
    @bijouAction( id: "release.openNotes", command: "release.openNotes", key: "Enter" )
    @bijouBind( id: "release.openNotes.label", kind: "state", path: "release.openNotesLabel" )
    @bijouI18n( key: "release.card.openNotes", fallback: "Open release notes" )
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
  it('compiles grouped GraphQL SDL into grouped block and scene facts', () => {
    const artifact = compileGraphqlBijouBlock(releaseCardSdl, {
      sourceName: 'release-card.graphql',
    });
    expect(artifact.groups).toEqual([
      {
        id: 'release.card.header',
        label: 'Header',
        layout: { x: 1, y: 1, width: 46, height: 3 },
        source: 'release-card.graphql#type.ReleaseCard.group.release.card.header',
      },
      {
        id: 'release.card.footer',
        label: 'Footer',
        layout: { x: 1, y: 5, width: 46, height: 2 },
        source: 'release-card.graphql#type.ReleaseCard.group.release.card.footer',
      },
    ]);
    expect(artifact.fields.map((field) => [field.nodeId, field.groupId])).toEqual([
      ['heading', 'release.card.header'],
      ['open-notes', 'release.card.footer'],
    ]);
    const scene = lowerBijouBlockToUiScene(artifact);
    expect(validateUiSceneIr(scene)).toEqual({ ok: true, issues: [] });
    expect(scene.nodes.map((node) => [node.id, node.kind, node.parentId, node.children])).toEqual([
      ['release.card.root', 'group', undefined, ['release.card.header', 'release.card.footer']],
      ['release.card.header', 'group', 'release.card.root', ['heading']],
      ['release.card.footer', 'group', 'release.card.root', ['open-notes']],
      ['heading', 'text', 'release.card.header', undefined],
      ['open-notes', 'text', 'release.card.footer', undefined],
    ]);
    expect(scene.sourceMap).toEqual([
      {
        nodeId: 'release.card.header',
        source: 'release-card.graphql#type.ReleaseCard.group.release.card.header',
      },
      {
        nodeId: 'release.card.footer',
        source: 'release-card.graphql#type.ReleaseCard.group.release.card.footer',
      },
      {
        nodeId: 'heading',
        source: 'release-card.graphql#type.ReleaseCard.field.heading',
      },
      {
        nodeId: 'open-notes',
        source: 'release-card.graphql#type.ReleaseCard.field.openNotes',
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
    expect(rowText(proof.lowering.surface, 5)).toContain('Open release notes');
    expect(proof.receipt.nodeIds).toEqual([
      'heading',
      'open-notes',
      'release.card.footer',
      'release.card.header',
      'release.card.root',
    ]);
    expect(proof.receipt.bindingIds).toEqual(['release.openNotes.label']);
  });
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
function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}
