import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('RE-007 migrate framed shell onto runtime engine seams cycle', () => {
  it('promotes RE-007 into the active runtime-engine cycle', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const cycle = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(existsRepoPath('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md')).toBe(true);
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');
    expect(bearing).toContain('[RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)');

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
    const cycle = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(layerImplementation).toContain('describeFrameRuntimeViewStack');
    expect(layerImplementation).toContain('createRuntimeViewStack');
    expect(layerImplementation).toContain('activeRuntimeView');
    expect(layerImplementation).toContain('RuntimeViewStack<FrameLayerDescriptor>');
    expect(appFrame).toContain('FrameRuntimeViewStack');
    expect(appFrame).toContain('describeFrameRuntimeViewStack');
    expect(appFrame).toContain('routeRuntimeInput');
    expect(appFrame).toContain('retainRuntimeLayout');
    expect(index).toContain('FrameRuntimeViewStack');
    expect(index).toContain('describeFrameRuntimeViewStack');
    expect(cycle).toContain('key ownership through the runtime view stack');
    expect(cycle).toContain('retained shell drawer layouts');
  });

  it('migrates workspace and settings sub-layer routing onto retained layouts', () => {
    const appFrame = readRepoFile('packages/bijou-tui/src/app-frame.ts');
    const cycle = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    // Workspace layout tree with tab and pane children
    expect(appFrame).toContain('buildWorkspaceLayoutTree');
    expect(appFrame).toContain("'header-bar'");
    expect(appFrame).toContain("'workspace-body'");
    expect(appFrame).toContain("`tab:${");
    expect(appFrame).toContain("`pane:${");

    // Settings row children in the retained layout
    expect(appFrame).toContain('buildSettingsRowChildren');
    expect(appFrame).toContain("`settings-row:${");

    // Pane geometry extraction
    expect(appFrame).toContain('resolveWorkspacePaneRects');

    // Workspace retained layout registration
    expect(appFrame).toContain("viewId: 'workspace'");

    // Cycle doc records the slice
    expect(cycle).toContain('workspace retained layout');
    expect(cycle).toContain('settings row children');
  });

  it('routes shell command/effect dispatch through runtime buffers', () => {
    const appFrame = readRepoFile('packages/bijou-tui/src/app-frame.ts');
    const types = readRepoFile('packages/bijou-tui/src/app-frame-types.ts');
    const cycle = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    // FrameShellCommand type defined as discriminated union
    expect(types).toContain('FrameShellCommand');
    expect(types).toContain("readonly type: 'observed-key'");
    expect(types).toContain("readonly type: 'emit-page-msg'");
    expect(types).toContain("readonly type: 'apply-frame-action'");
    expect(types).toContain("readonly type: 'quit'");

    // Handler table interprets commands inside createFramedApp
    expect(appFrame).toContain('shellCommandHandlers');
    expect(appFrame).toContain('drainShellCommandBuffer');

    // Buffer infrastructure wired
    expect(appFrame).toContain('bufferRuntimeRouteResult');
    expect(appFrame).toContain('applyRuntimeCommandBuffer');
    expect(appFrame).toContain('createRuntimeBuffers');

    // Old ad-hoc dispatch removed
    expect(appFrame).not.toContain('withObservedKey');
    expect(appFrame).not.toContain('handleFrameMouse');
    expect(appFrame).not.toContain('applyQuitRequest');

    // Cycle doc records the buffer migration
    expect(cycle).toContain('FrameShellCommand');
    expect(cycle).toContain('handler table');
    expect(cycle).toContain('drainShellCommandBuffer');
  });
});
