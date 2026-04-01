import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-001 runtime engine architecture cycle', () => {
  it('captures the new runtime-engine legend, invariants, design doc, and follow-on backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-001-define-runtime-engine-architecture.md');
    const stateInvariant = read('/Users/james/git/bijou/docs/invariants/state-machine-and-view-stack-are-distinct.md');
    const layoutInvariant = read('/Users/james/git/bijou/docs/invariants/layout-owns-interaction-geometry.md');
    const commandEffectInvariant = read('/Users/james/git/bijou/docs/invariants/commands-change-state-effects-do-not.md');
    const landedState = read('/Users/james/git/bijou/docs/design/RE-002-promote-first-class-state-machine-and-view-stack.md');
    const landedLayout = read('/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const landedRouting = read('/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = read('/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const backlogComponents = read('/Users/james/git/bijou/docs/BACKLOG/RE-006-formalize-component-layout-and-interaction-contracts.md');
    const backlogShell = read('/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(legend).toContain('RE — Runtime Engine');
    expect(legend).toContain('state machines');
    expect(legend).toContain('view stacks');
    expect(legend).toContain('retained layouts');
    expect(legend).toContain('commands');
    expect(legend).toContain('effects');

    expect(stateInvariant).toContain('Application state and visible views are related');
    expect(layoutInvariant).toContain('authoritative geometry for interaction comes from retained layout');
    expect(commandEffectInvariant).toContain('Commands are requests for app-owned stateful action');
    expect(commandEffectInvariant).toContain('Effects are non-stateful runtime consequences');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('the application owns a state machine');
    expect(cycle).toContain('the application owns a view stack');
    expect(cycle).toContain('the runtime retains layouts for those views');
    expect(cycle).toContain('components may emit commands and effects');
    expect(cycle).toContain('commands and effects are buffered separately');
    expect(cycle).toContain('## Retrospective');

    expect(landedState).toContain('state-machine object');
    expect(landedState).toContain('view-stack object');
    expect(landedLayout).toContain('retained-layout registry');
    expect(landedRouting).toContain('topmost view first');
    expect(landedBuffers).toContain('command and effect buffers');
    expect(landedBuffers).toContain('commands are applied later in FIFO order');
    expect(landedBuffers).toContain('effects are executed later in FIFO order');
    expect(backlogComponents).toContain('layout, overflow, and interaction');
    expect(backlogShell).toContain('framed shell');
  });
});
