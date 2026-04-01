import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-003 retained layout trees and layout invalidation cycle', () => {
  it('captures the active cycle, retained-layout semantics, and remaining runtime-engine backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const backlogRouting = read('/Users/james/git/bijou/docs/BACKLOG/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const backlogBuffers = read('/Users/james/git/bijou/docs/BACKLOG/RE-005-buffer-commands-and-effects-separately.md');
    const backlogComponents = read('/Users/james/git/bijou/docs/BACKLOG/RE-006-formalize-component-layout-and-interaction-contracts.md');

    expect(legend).toContain('RE-003 — Retain Layout Trees and Layout Invalidation');
    expect(legend).toContain('RE-004 — Route Input Through Layouts and Layer Bubbling');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('retained-layout registry');
    expect(cycle).toContain('terminal resize');
    expect(cycle).toContain('view-stack change');
    expect(cycle).toContain('content change');
    expect(cycle).toContain('drop layouts whose views are no longer present');
    expect(cycle).toContain('## Retrospective');

    expect(backlogRouting).toContain('topmost layer first');
    expect(backlogBuffers).toContain('command and effect buffer contracts');
    expect(backlogComponents).toContain('layout, overflow, and interaction');
  });
});
