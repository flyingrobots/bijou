import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('HT-002 layered focus and interaction cycle', () => {
  it('captures the humane-terminal layer cycle and its landed follow-on implementation cycle', () => {
    const cycle = readRepoFile('docs/design/HT-002-layered-focus-and-interaction.md');
    const implementationCycle = readRepoFile('docs/design/HT-003-implement-layer-stack-and-input-map-routing.md');

    expect(cycle).toContain('# HT-002 — Layered Focus and Interaction');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('input map');
    expect(cycle).toContain('Esc');
    expect(cycle).toContain('## Retrospective');
    expect(cycle).toContain('[HT-003 — Implement Layer Stack and Input Map Routing]');

    expect(implementationCycle).toContain('describeFrameLayerStack()');
    expect(implementationCycle).toContain('topmost-layer-driven key routing');
  });

  it('records the new dismiss-order invariant and doctrine links', () => {
    const invariants = readRepoFile('docs/invariants/README.md');
    const invariant = readRepoFile('docs/invariants/topmost-layer-dismisses-first.md');
    const shell = readRepoFile('docs/strategy/humane-shell.md');
    const patterns = readRepoFile('docs/design-system/patterns.md');
    const ux = readRepoFile('docs/strategy/bijou-ux-doctrine.md');

    expect(invariants).toContain('Topmost Layer Dismisses First');
    expect(invariant).toContain('dismiss actions should target the topmost dismissible layer');
    expect(invariant).toContain('Esc');

    expect(shell).toContain('Layers dismiss from the top');
    expect(shell).toContain('Input maps should drive truth');

    expect(patterns).toContain('Layers should behave like a stack');
    expect(patterns).toContain('the topmost layer owns the visible control hints');

    expect(ux).toContain('Layers should dismiss from the top');
    expect(ux).toContain('the thing on top owns visible controls');
  });
});
