import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('HT-004 explicit layer objects and shell introspection cycle', () => {
  it('captures the richer layer-object cycle and its follow-on backlog item', () => {
    const legend = readRepoFile('docs/legends/HT-humane-terminal.md');
    const cycle = readRepoFile('docs/design/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md');
    const backlog = readRepoFile('docs/BACKLOG/HT-005-promote-page-provided-layer-registry-and-shell-control-projection.md');

    expect(legend).toContain('HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection');
    expect(legend).toContain('HT-005 — Promote Page-Provided Layer Registry and Shell Control Projection');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('title');
    expect(cycle).toContain('hint source');
    expect(cycle).toContain('help source');
    expect(cycle).toContain('## Retrospective');

    expect(backlog).toContain('page-provided layer registry');
    expect(backlog).toContain('control projection');
  });
});
