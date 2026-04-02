import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('RE-003 retained layout trees and layout invalidation cycle', () => {
  it('captures the active cycle, retained-layout semantics, and remaining runtime-engine backlog slices', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const cycle = readRepoFile('docs/design/RE-003-retain-layout-trees-and-layout-invalidation.md');
    const landedRouting = readRepoFile('docs/design/RE-004-route-input-through-layouts-and-layer-bubbling.md');
    const landedBuffers = readRepoFile('docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const landedComponents = readRepoFile('docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md');

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
