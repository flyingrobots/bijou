import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-003 retained layout trees and layout invalidation cycle', () => {
  it('captures the active cycle, retained-layout semantics, and remaining runtime-engine backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const landedRouting = read('/Users/james/git/bijou/docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = read('/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const landedComponents = read('/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md');

    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('retained-layout registry');
    expect(cycle).toContain('terminal resize');
    expect(cycle).toContain('view-stack change');
    expect(cycle).toContain('content change');
    expect(cycle).toContain('drop layouts whose views are no longer present');
    expect(cycle).toContain('## Retrospective');

    expect(landedRouting).toContain('topmost view first');
    expect(landedBuffers).toContain('command and effect buffers');
    expect(landedComponents).toContain('explicit layout rules');
  });
});
