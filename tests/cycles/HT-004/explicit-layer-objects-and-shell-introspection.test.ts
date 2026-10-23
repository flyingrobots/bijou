import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('HT-004 explicit layer objects and shell introspection cycle', () => {
  it('captures the richer layer-object cycle and its follow-on backlog item', () => {
    const cycle = readRepoFile('docs/design/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md');
    const backlog = readRepoFile('docs/method/retro/HT_005-promote-page-provided-layer-registry-and-shell-control-projection.md');

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
