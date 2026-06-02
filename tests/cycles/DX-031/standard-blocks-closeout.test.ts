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
  });

  it('marks DX-031 landed in Method evidence after closing issue 181', () => {
    const design = readRepoFile('docs/design/DX-031-standard-bijou-blocks.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(design).toContain('DX-031 is landed for the `v6.0.0` release boundary.');
    expect(design).toContain('DOGFOOD multi-mode proof is present');
    expect(design).toMatch(/Catalog expansion beyond `AppShell`, `ReaderSurface`, and `InspectorPanel`\s+belongs to later issues/);
    expect(design).not.toContain('DX-031 is now partially landed rather than not started.');

    expect(changelog).toContain('DX-031 standard blocks closeout');
    expect(changelog).toContain('AppShell`, `ReaderSurface`, and `InspectorPanel`');
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
