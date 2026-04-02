import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('RE-002 first-class state machine and view stack cycle', () => {
  it('captures the active cycle, legend progression, and remaining runtime-engine backlog slices', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const cycle = readRepoFile('docs/design/RE-002-promote-first-class-state-machine-and-view-stack.md');
    const landedLayout = readRepoFile('docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const landedRouting = readRepoFile('docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = readRepoFile('docs/design/RE-005-buffer-commands-and-effects-separately.md');

    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('first-class state-machine object');
    expect(cycle).toContain('first-class view-stack object');
    expect(cycle).toContain('non-dismissible workspace root view');
    expect(cycle).toContain('push/pop/replace/clear semantics');
    expect(cycle).toContain('## Retrospective');

    expect(landedLayout).toContain('retained-layout registry');
    expect(landedRouting).toContain('topmost view first');
    expect(landedBuffers).toContain('append multiple route results');
  });
});
