import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-004 route input through layouts and layer bubbling cycle', () => {
  it('captures the active cycle, routing semantics, and remaining runtime-engine backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = read('/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const backlogComponents = read('/Users/james/git/bijou/docs/BACKLOG/RE-006-formalize-component-layout-and-interaction-contracts.md');

    expect(legend).toContain('RE-005 — Buffer Commands and Effects Separately');
    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('topmost view first');
    expect(cycle).toContain('layout-driven hit testing');
    expect(cycle).toContain('unhandled input bubbles');
    expect(cycle).toContain('stops at blocking views');
    expect(cycle).toContain('visited view ids');
    expect(cycle).toContain('commands and effects emitted');
    expect(cycle).toContain('## Retrospective');

    expect(landedBuffers).toContain('buffer route outputs');
    expect(backlogComponents).toContain('layout, overflow, and interaction');
  });
});
