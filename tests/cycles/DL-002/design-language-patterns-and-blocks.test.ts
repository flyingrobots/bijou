import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('DL-002 canonical patterns and blocks cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DL-002-canonicalize-patterns-and-blocks.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('documents canonical selection, focus, spacing, overflow, and blocks in the design system', () => {
    const patterns = read('/Users/james/git/bijou/docs/design-system/patterns.md');
    const blocks = read('/Users/james/git/bijou/docs/design-system/blocks.md');

    expect(patterns).toContain('Background fill means current selection');
    expect(patterns).toContain('Structural accent');
    expect(patterns).toContain('active region');
    expect(patterns).toContain('one cell of padding');
    expect(patterns).toContain('stack beneath the label');
    expect(patterns).toContain('Visible Controls Are a Promise');

    expect(blocks).toContain('Blocks come after doctrine, patterns, and components.');
    expect(blocks).toContain('App frame');
    expect(blocks).toContain('Settings drawer');
    expect(blocks).toContain('Guided flow');
  });

  it('updates the design system read order and spawns the next DL backlog item', () => {
    const readme = read('/Users/james/git/bijou/docs/design-system/README.md');
    const legend = read('/Users/james/git/bijou/docs/legends/DL-design-language.md');
    const backlog = read('/Users/james/git/bijou/docs/BACKLOG/DL-003-prove-canonical-patterns-in-shared-surfaces.md');

    expect(readme).toContain('[Blocks](./blocks.md)');
    expect(legend).toContain('[DL-002 — Canonicalize Patterns and Blocks]');
    expect(backlog).toContain('DL-003 — Prove Canonical Patterns in Shared Surfaces');
  });
});
