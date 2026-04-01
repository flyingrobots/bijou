import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-002 first-class state machine and view stack cycle', () => {
  it('captures the active cycle, legend progression, and remaining runtime-engine backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-002-promote-first-class-state-machine-and-view-stack.md');
    const landedLayout = read('/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const landedRouting = read('/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = read('/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md');

    expect(legend).toContain('RE-005 — Buffer Commands and Effects Separately');
    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');

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
