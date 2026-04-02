import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('HT-003 layer stack routing cycle', () => {
  it('captures the implementation cycle and richer follow-on backlog item', () => {
    const legend = readRepoFile('docs/legends/HT-humane-terminal.md');
    const cycle = readRepoFile('docs/design/HT-003-implement-layer-stack-and-input-map-routing.md');
    const nextCycle = readRepoFile('docs/design/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md');

    expect(legend).toContain('HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('describeFrameLayerStack()');
    expect(cycle).toContain('footer hints');
    expect(cycle).toContain('## Retrospective');

    expect(nextCycle).toContain('explicit layer objects');
    expect(nextCycle).toContain('Richer Shell Introspection');
  });
});
