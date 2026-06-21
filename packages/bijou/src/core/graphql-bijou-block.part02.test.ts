import {
  compileGraphqlBijouBlock,
  describe,
  expect,
  it,
  lowerBijouBlockToUiScene,
  lowerUiSceneToTerminalProof,
  must,
  releaseTitleSdl,
  rowText,
} from './graphql-bijou-block.test-support.js';

describe('GraphQL-authored Bijou block artifacts', () => {
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
});

describe('GraphQL-authored Bijou block artifacts', () => {
it('fails loudly when the SDL omits the block directive', () => {
    expect(() => compileGraphqlBijouBlock(`
      type MissingBlock {
        heading: String
          @bijouText(id: "heading", x: 0, y: 0)
          @bijouI18n(key: "heading", fallback: "Heading")
      }
    `)).toThrow('GraphQL Bijou block source must include @bijouBlock(id:, component:).');
  });
});

describe('GraphQL-authored Bijou block artifacts', () => {
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
});

describe('GraphQL-authored Bijou block artifacts', () => {
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
          ...must(validArtifact.fields[0]),
          fieldName: 'duplicateHeading',
        },
      ],
    };
    expect(() => lowerBijouBlockToUiScene(invalidArtifact))
      .toThrow('Duplicate GraphQL Bijou block node id: heading');
  });
});
