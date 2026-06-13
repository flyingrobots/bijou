import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DL-013 design token and theme builder spec', () => {
  it('defines the token, theme, mode, and style relationship', () => {
    expect(existsRepoPath('docs/design/DL-013-design-token-theme-builder-api.md')).toBe(true);

    const design = readRepoFile('docs/design/DL-013-design-token-theme-builder-api.md');

    expect(design).toContain('Tokens describe semantic color slots in a theme.');
    expect(design).toContain('Themes own mode-specific token values.');
    expect(design).toContain('Dark and light are the required first theme modes.');
    expect(design).toContain('Styles consume resolved tokens at render time.');
    expect(design).toContain(
      'Styles do not register tokens, own theme values, or decide dark/light mode.',
    );
    expect(design).toContain('defineTheme()');
    expect(design).toContain('.mode("dark"');
    expect(design).toContain('.mode("light"');
    expect(design).toContain('tokenRef("color.status.danger.bg")');
    expect(design).toContain('style()');
    expect(design).toContain('render(surfaceText, { theme, mode: "dark" })');
  });

  it('follows the modern Method design document shape', () => {
    const design = readRepoFile('docs/design/DL-013-design-token-theme-builder-api.md');

    expect(design).toContain('Legend: [DL - Design Language]');
    expect(design).toContain('## Sponsored Human');
    expect(design).toContain('## Sponsored Agent');
    expect(design).toContain('## Hill');
    expect(design).toContain('## Playback Questions');
    expect(design).toContain('## Accessibility / Assistive Reading Posture');
    expect(design).toContain('## Localization / Directionality Posture');
    expect(design).toContain('## Agent Inspectability / Explainability Posture');
    expect(design).toContain('## Linked Invariants');
    expect(design).toContain('## Implementation Outline');
    expect(design).toContain('## Tests To Write First');
    expect(design).toContain('## Retrospective');
  });

  it('puts DL-013 onto the GitHub-backed roadmap', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const closedLineage = sectionBetween(roadmap, '## Closed Lineage', '## Maintenance Rule');

    expect(roadmap).toContain(
      '| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) |',
    );
    expect(roadmap).toContain('Product Workbench And Operator Surfaces');
    expect(roadmap).toContain('Theme Lab and Theme Inspector provenance surfaces backed by token facts');
    expect(roadmap).toContain('[#311](https://github.com/flyingrobots/bijou/issues/311)');
    expect(roadmap).toContain('[#315](https://github.com/flyingrobots/bijou/issues/315)');
    expect(roadmap).toContain('[#317](https://github.com/flyingrobots/bijou/issues/317)');
    expect(roadmap).toContain('[#318](https://github.com/flyingrobots/bijou/issues/318)');
    expect(closedLineage).toContain('[#308](https://github.com/flyingrobots/bijou/issues/308)');
    expect(closedLineage).toContain('[#314](https://github.com/flyingrobots/bijou/issues/314)');
  });

  it('locks the safe-pair contrast matrix follow-up into the design trail', () => {
    expect(existsRepoPath('docs/design/DL-015-theme-safe-pairs-and-contrast-matrices.md')).toBe(true);

    const design = readRepoFile('docs/design/DL-015-theme-safe-pairs-and-contrast-matrices.md');
    const umbrella = readRepoFile('docs/design/DL-013-design-token-theme-builder-api.md');

    expect(design).toContain('github_issue: 314');
    expect(design).toContain('title: DL-015 Theme safe pairs and contrast matrices');
    expect(design).toContain('defineThemeSafePairs()');
    expect(design).toContain("surface.primary.bg");
    expect(design).toContain('DOGFOOD_THEME_SAFE_PAIRS');
    expect(design).toContain('## Implementation Outline');
    expect(umbrella).toContain('[DL-015](DL-015-theme-safe-pairs-and-contrast-matrices.md)');
    expect(umbrella).toContain('[#314](https://github.com/flyingrobots/bijou/issues/314)');
  });
});

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}
