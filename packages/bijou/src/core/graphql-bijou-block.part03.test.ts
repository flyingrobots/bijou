import {
  compileGraphqlBijouBlock,
  describe,
  expect,
  it,
  lowerBijouBlockToUiScene,
  lowerUiSceneToTerminalProof,
  releaseCardSdl,
  rowText,
  validateUiSceneIr,
} from './graphql-bijou-block.test-support.js';

describe('GraphQL-authored Bijou block artifacts', () => {
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
});
