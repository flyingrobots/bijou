import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('RE-007 migrate framed shell onto runtime engine seams cycle', () => {
  it('promotes RE-007 into the active runtime-engine cycle', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const plan = readRepoFile('docs/PLAN.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const cycle = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');
    const backlog = readRepoFile('docs/BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(existsRepoPath('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md')).toBe(true);
    expect(legend).toContain('active cycle:');
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');
    expect(plan).toContain('## Active Cycle');
    expect(plan).toContain('./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');
    expect(bearing).toContain('[RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)');
    expect(backlog).toContain('Promoted into the active cycle doc');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('RuntimeViewStack');
    expect(cycle).toContain('workspace is the root runtime view');
    expect(cycle).toContain('first honest slice');
    expect(cycle).toContain('retained-layout-driven shell routing');
    expect(cycle).toContain('runtime-buffer-backed shell command/effect dispatch');
    expect(cycle).toContain('## Retrospective');
  });

  it('backs frame layer introspection with runtime engine objects and public exports', () => {
    const layerImplementation = readRepoFile('packages/bijou-tui/src/app-frame-layers.ts');
    const appFrame = readRepoFile('packages/bijou-tui/src/app-frame.ts');
    const index = readRepoFile('packages/bijou-tui/src/index.ts');

    expect(layerImplementation).toContain('describeFrameRuntimeViewStack');
    expect(layerImplementation).toContain('createRuntimeViewStack');
    expect(layerImplementation).toContain('activeRuntimeView');
    expect(layerImplementation).toContain('RuntimeViewStack<FrameLayerDescriptor>');
    expect(appFrame).toContain('FrameRuntimeViewStack');
    expect(appFrame).toContain('describeFrameRuntimeViewStack');
    expect(index).toContain('FrameRuntimeViewStack');
    expect(index).toContain('describeFrameRuntimeViewStack');
  });
});
