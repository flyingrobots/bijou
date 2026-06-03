import { describe, expect, it } from 'vitest';
import {
  standardBlocks,
  standardBlockStories,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

describe('DX-031 standard blocks closeout', () => {
  it('keeps the first standard block set concrete and mode-aware', () => {
    expect(standardBlocks.map((block) => block.metadata.blockName)).toEqual([
      'AppShell',
      'ReaderSurface',
      'InspectorPanel',
      'InlineStatusBlock',
      'InFlowStatusBlock',
      'TransientOverlayBlock',
      'ActivityStreamBlock',
      'ShortcutCueBlock',
      'ProgressIndicatorBlock',
      'FramedGroupBlock',
      'ExplainabilityWalkthroughBlock',
      'FormattedDocumentBlock',
      'LinkDestinationBlock',
      'DividerBlock',
      'TextEntryBlock',
      'SingleChoiceBlock',
      'MultipleChoiceBlock',
      'BinaryDecisionBlock',
      'PeerNavigationBlock',
      'ProgressiveDisclosureBlock',
      'PathProgressBlock',
    ]);

    for (const block of standardBlocks) {
      expect(block.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(block.metadata.storyIds ?? []).not.toHaveLength(0);

      for (const mode of block.metadata.modes) {
        const rendered = block.render({
          mode,
          slots: renderSlotsFor(block.metadata.blockName),
        });

        expect(rendered.output).toBeDefined();
        expect(rendered.facts).toContainEqual({
          kind: 'entity',
          key: 'block',
          value: block.metadata.blockName,
        });
      }
    }
  });

  it('keeps first-party story coverage in release scope', () => {
    const storyStates = new Map(
      standardBlocks.map((block) => [
        block.metadata.blockName,
        standardBlockStories
          .filter((story) => story.blockName === block.metadata.blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storyStates.get('AppShell')).toEqual(['ready', 'narrow', 'overlay']);
    expect(storyStates.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storyStates.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);
    expect(storyStates.get('InlineStatusBlock')).toEqual(['ready']);
    expect(storyStates.get('InFlowStatusBlock')).toEqual(['ready']);
    expect(storyStates.get('TransientOverlayBlock')).toEqual(['ready']);
    expect(storyStates.get('ActivityStreamBlock')).toEqual(['ready']);
    expect(storyStates.get('ShortcutCueBlock')).toEqual(['ready']);
    expect(storyStates.get('ProgressIndicatorBlock')).toEqual(['ready']);
    expect(storyStates.get('FramedGroupBlock')).toEqual(['ready']);
    expect(storyStates.get('ExplainabilityWalkthroughBlock')).toEqual(['ready']);
    expect(storyStates.get('FormattedDocumentBlock')).toEqual(['ready']);
    expect(storyStates.get('LinkDestinationBlock')).toEqual(['ready']);
    expect(storyStates.get('DividerBlock')).toEqual(['ready']);
    expect(storyStates.get('TextEntryBlock')).toEqual(['ready']);
    expect(storyStates.get('SingleChoiceBlock')).toEqual(['ready']);
    expect(storyStates.get('MultipleChoiceBlock')).toEqual(['ready']);
    expect(storyStates.get('BinaryDecisionBlock')).toEqual(['ready']);
    expect(storyStates.get('PeerNavigationBlock')).toEqual(['ready']);
    expect(storyStates.get('ProgressiveDisclosureBlock')).toEqual(['ready']);
    expect(storyStates.get('PathProgressBlock')).toEqual(['ready']);
  });

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
  });

  it('keeps v6 tracker docs aligned after closing issue 181', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const backlog = readRepoFile('docs/method/backlog/v6.0.0/README.md');
    const roadmapOpenWork = sectionBetween(roadmap, '### Open Work', '### Completed Lineage');
    const roadmapCompletedLineage = sectionBetween(roadmap, '### Completed Lineage', '## v7.0.0');

    expect(bearing).not.toContain('[#181](https://github.com/flyingrobots/bijou/issues/181) — `DX-031`');

    expect(roadmapOpenWork).not.toContain('[#181](https://github.com/flyingrobots/bijou/issues/181)');
    expect(roadmapCompletedLineage).toContain('| [#181](https://github.com/flyingrobots/bijou/issues/181) | `lane:release` | `type:enhancement` | DX-031 standard Bijou blocks |');

    expect(backlog).toContain('## Landed Standard Blocks Anchor');
    expect(backlog).toContain('issue #181');
  });
});

function renderSlotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'AppShell':
      return {
        navigation: 'Docs nav',
        content: 'Blocks guide',
        inspector: 'Current selection',
        status: 'Ready',
        overlays: ['Help'],
      };
    case 'ReaderSurface':
      return {
        content: 'Readable block documentation.',
        navigation: 'Docs nav',
        outline: ['Intro', 'Lowering'],
      };
    case 'InspectorPanel':
      return {
        selection: 'ReaderSurface',
        details: ['schema-aware', 'command-aware'],
        actions: ['reveal source'],
      };
    case 'InlineStatusBlock':
      return { label: 'docs', status: 'ok', message: 'synced' };
    case 'InFlowStatusBlock':
      return {
        severity: 'warning',
        source: 'docs',
        message: 'inventory stale',
        action: 'run docs:inventory',
      };
    case 'TransientOverlayBlock':
      return {
        priority: 'normal',
        message: 'Saved DOGFOOD route',
        dismiss: 'Esc dismisses',
      };
    case 'ActivityStreamBlock':
      return {
        events: ['10:41 tests passed', '10:42 PR opened'],
        selected: '10:41 tests passed',
      };
    case 'ShortcutCueBlock':
      return { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' };
    case 'ProgressIndicatorBlock':
      return { label: 'Install packages', value: '3', total: '5', percent: '60%' };
    case 'FramedGroupBlock':
      return {
        title: 'Release Checks',
        items: ['tests green', 'docs updated', 'PR linked'],
        selected: 'tests green',
        mode: 'review',
      };
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: 'Why this changed',
        steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
        evidence: 'DF-040 playback',
        decision: 'keep grouped proof visible',
        nextStep: 'open lower-mode output',
      };
    case 'FormattedDocumentBlock':
      return {
        heading: 'Blocks document',
        body: 'Use prose for persistent product truth.',
        callout: 'Lower modes keep the same heading and body facts.',
        code: 'block: FormattedDocumentBlock',
      };
    case 'LinkDestinationBlock':
      return {
        label: 'DOGFOOD.md',
        destination: 'docs/DOGFOOD.md',
        kind: 'docs',
        status: 'available',
      };
    case 'DividerBlock':
      return {
        label: 'Release Evidence',
        style: 'rule',
        density: 'compact',
      };
    case 'TextEntryBlock':
      return {
        field: 'Search docs',
        value: 'table',
        placeholder: 'type a query',
        validation: '4 results',
        results: 4,
      };
    case 'SingleChoiceBlock':
      return {
        label: 'Output mode',
        options: ['interactive', 'pipe', 'accessible'],
        selected: 'pipe',
        mode: 'radio',
        validation: 'available',
      };
    case 'MultipleChoiceBlock':
      return {
        label: 'Release proof',
        checked: ['lint', 'tests'],
        unchecked: ['screenshots'],
        selected: 'lint; tests',
        validation: '2 of 3 complete',
      };
    case 'BinaryDecisionBlock':
      return {
        label: 'Merge gate',
        selected: 'yes',
        consequence: 'admin merge',
        confirmation: 'CI green',
        disabledReason: 'none',
      };
    case 'PeerNavigationBlock':
      return {
        previous: 'Architecture',
        current: 'Blocks',
        next: 'Method',
        route: 'docs/blocks',
        status: 'available',
      };
    case 'ProgressiveDisclosureBlock':
      return {
        label: 'Advanced options',
        state: 'closed',
        hiddenCount: 6,
        summary: '6 options hidden',
        details: ['debug traces', 'layout facts'],
      };
    case 'PathProgressBlock':
      return {
        path: ['Setup', 'Blocks', 'Preview'],
        current: 'Blocks',
        step: 2,
        total: 3,
        status: 'current',
      };
    default:
      throw new Error(`unknown standard block ${blockName}`);
  }
}

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}
