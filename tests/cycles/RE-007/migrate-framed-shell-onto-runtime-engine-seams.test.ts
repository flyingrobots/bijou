import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

const readFrameModule = (name: string) =>
  readRepoFile(`packages/bijou-tui/src/${name}`);

describe('RE-007 migrate framed shell onto runtime engine seams cycle', () => {
  it('promotes RE-007 into the active runtime-engine cycle', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const cycle = readRepoFile(
      'docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md',
    );

    expect(
      existsRepoPath(
        'docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md',
      ),
    ).toBe(true);
    expect(legend).toContain(
      'RE-007 — Migrate Framed Shell Onto Runtime Engine Seams',
    );
    expect(bearing).toContain(
      '[RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)',
    );

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('RuntimeViewStack');
    expect(cycle).toContain('workspace is the root runtime view');
    expect(cycle).toContain('first honest slice');
    expect(cycle).toContain('retained-layout-driven shell routing');
    expect(cycle).toContain(
      'runtime-buffer-backed shell command/effect dispatch',
    );
    expect(cycle).toContain('## Retrospective');
  });

  it('backs frame layer introspection with runtime engine objects and public exports', () => {
    const layerImplementation = [
      'part01',
      'part02',
      'part03',
      'part04',
    ]
      .map((part) => readFrameModule(`app-frame-layers.${part}.ts`))
      .join('\n');
    const appFrame = readFrameModule('app-frame.ts');
    const routingImplementation = [
      'app-frame-key-route.ts',
      'app-frame-mouse-layout.ts',
    ]
      .map(readFrameModule)
      .join('\n');
    const index = readFrameModule('index.ts');
    const indexPart = readFrameModule('index.part04.ts');
    const cycle = readRepoFile(
      'docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md',
    );

    expect(layerImplementation).toContain('describeFrameRuntimeViewStack');
    expect(layerImplementation).toContain('createRuntimeViewStack');
    expect(layerImplementation).toContain('activeRuntimeView');
    expect(layerImplementation).toContain(
      'RuntimeViewStack<FrameLayerDescriptor>',
    );
    expect(appFrame).toContain('FrameRuntimeViewStack');
    expect(appFrame).toContain('describeFrameRuntimeViewStack');
    expect(routingImplementation).toContain('routeRuntimeInput');
    expect(routingImplementation).toContain('retainRuntimeLayout');
    expect(index).toContain("export * from './index.part04.js'");
    expect(indexPart).toContain('FrameRuntimeViewStack');
    expect(indexPart).toContain('describeFrameRuntimeViewStack');
    expect(cycle).toContain('key ownership through the runtime view stack');
    expect(cycle).toContain('retained shell drawer layouts');
  });

  it('migrates workspace and settings sub-layer routing onto retained layouts', () => {
    const workspaceTree = readFrameModule('app-frame-workspace-tree.ts');
    const mouseLayout = readFrameModule('app-frame-mouse-layout.ts');
    const mouseWorkspace = readFrameModule('app-frame-mouse-workspace.ts');
    const cycle = readRepoFile(
      'docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md',
    );

    // Workspace layout tree with tab and pane children
    expect(workspaceTree).toContain('buildWorkspaceLayoutTreeFromPaneRects');
    expect(workspaceTree).toContain("'header-bar'");
    expect(workspaceTree).toContain("'workspace-body'");
    expect(workspaceTree).toContain('`tab:${');
    expect(workspaceTree).toContain('`pane:${');

    // Settings row children in the retained layout
    expect(mouseLayout).toContain('settingsRowChildren');
    expect(mouseLayout).toContain('`settings-row:${');

    // Pane geometry extraction
    expect(mouseWorkspace).toContain('workspace.paneRects(model)');

    // Workspace retained layout registration
    expect(mouseLayout).toContain("viewId: 'workspace'");

    // Cycle doc records the slice
    expect(cycle).toContain('workspace retained layout');
    expect(cycle).toContain('settings row children');
  });

  it('routes shell command/effect dispatch through runtime buffers', () => {
    const shellCommand = readFrameModule('app-frame-shell-command.ts');
    const actionTypes = readFrameModule('app-frame-action-types.ts');
    const compatibilityTypes = readFrameModule('app-frame-types.ts');
    const cycle = readRepoFile(
      'docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md',
    );

    // FrameShellCommand type defined as discriminated union
    expect(actionTypes).toContain('FrameShellCommand');
    expect(actionTypes).toContain("readonly type: 'observed-key'");
    expect(actionTypes).toContain("readonly type: 'emit-page-msg'");
    expect(actionTypes).toContain("readonly type: 'apply-frame-action'");
    expect(actionTypes).toContain("readonly type: 'quit'");
    expect(compatibilityTypes).toContain(
      "export type * from './app-frame-action-types.js'",
    );

    // Command dispatcher interprets shell commands for createFramedApp
    expect(shellCommand).toContain('applyShellCommand');
    expect(shellCommand).toContain('drainShellCommandBuffer');

    // Buffer infrastructure wired
    expect(shellCommand).toContain('bufferRuntimeRouteResult');
    expect(shellCommand).toContain('applyRuntimeCommandBuffer');
    expect(shellCommand).toContain('createRuntimeBuffers');

    // Old ad-hoc dispatch removed
    expect(shellCommand).not.toContain('withObservedKey');
    expect(shellCommand).not.toContain('handleFrameMouse');
    expect(shellCommand).not.toContain('applyQuitRequest');

    // Cycle doc records the buffer migration
    expect(cycle).toContain('FrameShellCommand');
    expect(cycle).toContain('handler table');
    expect(cycle).toContain('drainShellCommandBuffer');
  });
});
