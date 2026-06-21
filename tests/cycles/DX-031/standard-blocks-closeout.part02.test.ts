import { describe, expect, it, readRepoFile, sectionBetween } from './standard-blocks-closeout.test-support.js';

describe('DX-031 standard blocks closeout', () => {
  it('marks DX-031 landed in Method evidence after closing issue 181', () => {
    const design = readRepoFile('docs/design/DX-031-standard-bijou-blocks.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(design).toContain('DX-031 is landed for the `v6.0.0` release boundary.');
    expect(design).toContain('DOGFOOD multi-mode proof is present');
    expect(design).toMatch(
      /Status and feedback block expansion is now explicit issue-backed v6 work\s+through #220 through #225/,
    );
    expect(design).not.toContain('DX-031 is now partially landed rather than not started.');

    expect(changelog).toContain('DX-031 standard blocks closeout');
    expect(changelog).toContain('AppShell`, `ReaderSurface`, and `InspectorPanel`');
    expect(changelog).toContain('Status and feedback standard Blocks');
    expect(changelog).toContain('InlineStatusBlock');
    expect(changelog).toContain('InFlowStatusBlock');
    expect(changelog).toContain('TransientOverlayBlock');
    expect(changelog).toContain('ActivityStreamBlock');
    expect(changelog).toContain('ShortcutCueBlock');
    expect(changelog).toContain('ProgressIndicatorBlock');
    expect(changelog).toContain('FramedGroupBlock');
    expect(changelog).toContain('ExplainabilityWalkthroughBlock');
    expect(changelog).toContain('FormattedDocumentBlock');
    expect(changelog).toContain('LinkDestinationBlock');
    expect(changelog).toContain('DividerBlock');
    expect(changelog).toContain('TextEntryBlock');
    expect(changelog).toContain('SingleChoiceBlock');
    expect(changelog).toContain('MultipleChoiceBlock');
    expect(changelog).toContain('BinaryDecisionBlock');
    expect(changelog).toContain('PeerNavigationBlock');
    expect(changelog).toContain('ProgressiveDisclosureBlock');
    expect(changelog).toContain('PathProgressBlock');
    expect(changelog).toContain('BrandEmphasisBlock');
    expect(changelog).toContain('ModeAwarePrimitiveBlock');
    expect(changelog).toContain('DenseComparisonBlock');
    expect(changelog).toContain('HierarchyBlock');
    expect(changelog).toContain('ExplorationListBlock');
    expect(changelog).toContain('TemporalDependencyBlock');
  });
});

describe('DX-031 standard blocks closeout', () => {
  it('keeps compressed v6 lineage pointing to issue 181 evidence', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const backlog = readRepoFile('docs/method/backlog/v6.0.0/README.md');
    const roadmapClosedLineage = sectionBetween(roadmap, '## Closed Lineage', '## Maintenance Rule');

    expect(bearing).not.toContain('[#181](https://github.com/flyingrobots/bijou/issues/181) — `DX-031`');

    expect(roadmapClosedLineage).toContain('`v6.0.0`');
    expect(roadmapClosedLineage).toContain('Skipped public release; complete lineage');
    expect(roadmap).not.toContain('[#181](https://github.com/flyingrobots/bijou/issues/181)');

    expect(backlog).toContain('## Landed Standard Blocks Anchor');
    expect(backlog).toContain('issue #181');
  });
});
