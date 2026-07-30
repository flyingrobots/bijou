export const TRANCHE_B_ROOTS = [
  'packages/bijou-tui/src/runtime.ts',
  'examples/perf-gradient/main.ts',
  'packages/bijou-tui/src/driver.ts',
  'packages/bijou/src/core/components/dag-render.ts',
  'packages/bijou-tui-app/src/index.ts',
] as const;

export const TRANCHE_B_PUBLIC_EXPORTS = {
  'packages/bijou-tui/src/runtime.ts': [
    'RuntimeLifecycleHooks',
    'RuntimePostRenderEffect',
    'RuntimeRenderSummary',
    'run',
    'runWithLifecycleHooks',
  ],
  'examples/perf-gradient/main.ts': [],
  'packages/bijou-tui/src/driver.ts': [
    'MouseMoveStepOptions',
    'MouseScriptStep',
    'MouseScriptStepOptions',
    'MouseWheelDirection',
    'RunScriptOptions',
    'RunScriptResult',
    'ScriptStep',
    'TestHarness',
    'TestRuntimeCommandRecord',
    'TestRuntimeCommandResolution',
    'TestRuntimeOptions',
    'TestRuntimeSnapshot',
    'mouseMove',
    'mousePress',
    'mouseRelease',
    'mouseWheel',
    'runScript',
    'sgrMouse',
    'testRuntime',
  ],
  'packages/bijou/src/core/components/dag-render.ts': [
    'renderAccessible',
    'renderInteractiveLayout',
    'renderPipe',
  ],
  'packages/bijou-tui-app/src/index.ts': [
    'CreateTuiAppSkeletonOptions',
    'SkeletonLayoutContext',
    'SkeletonMsg',
    'SkeletonPageModel',
    'SkeletonRenderContext',
    'SkeletonStatusContext',
    'SkeletonTab',
    'SkeletonThemeTokens',
    'createTuiAppSkeleton',
  ],
} as const satisfies Readonly<Record<
  (typeof TRANCHE_B_ROOTS)[number],
  readonly string[]
>>;

export const TRANCHE_B_FAMILY_MEMBERS = {
  'packages/bijou-tui/src/runtime.ts': [
    'packages/bijou-tui/src/runtime.ts',
    'packages/bijou-tui/src/runtime-contract.ts',
    'packages/bijou-tui/src/runtime-loop.ts',
    'packages/bijou-tui/src/runtime-render.ts',
    'packages/bijou-tui/src/runtime-shutdown.ts',
  ],
  'examples/perf-gradient/main.ts': [
    'examples/perf-gradient/main.ts',
    'examples/perf-gradient/perf-chart.ts',
    'examples/perf-gradient/perf-memory.ts',
    'examples/perf-gradient/perf-model.ts',
    'examples/perf-gradient/perf-noise.ts',
    'examples/perf-gradient/perf-paint-ansi.ts',
    'examples/perf-gradient/perf-paint-rgb.ts',
    'examples/perf-gradient/perf-render.ts',
  ],
  'packages/bijou-tui/src/driver.ts': [
    'packages/bijou-tui/src/driver.ts',
    'packages/bijou-tui/src/driver-contract.ts',
    'packages/bijou-tui/src/driver-harness.ts',
    'packages/bijou-tui/src/driver-mouse.ts',
    'packages/bijou-tui/src/driver-script.ts',
  ],
  'packages/bijou/src/core/components/dag-render.ts': [
    'packages/bijou/src/core/components/dag-render.ts',
    'packages/bijou/src/core/components/dag-render-contract.ts',
    'packages/bijou/src/core/components/dag-render-grid.ts',
    'packages/bijou/src/core/components/dag-render-layout.ts',
    'packages/bijou/src/core/components/dag-render-metrics.ts',
    'packages/bijou/src/core/components/dag-render-node.ts',
    'packages/bijou/src/core/components/dag-render-text.ts',
  ],
  'packages/bijou-tui-app/src/index.ts': [
    'packages/bijou-tui-app/src/index.ts',
    'packages/bijou-tui-app/src/skeleton-chrome.ts',
    'packages/bijou-tui-app/src/skeleton-contract.ts',
    'packages/bijou-tui-app/src/skeleton-create.ts',
    'packages/bijou-tui-app/src/skeleton-drawer.ts',
    'packages/bijou-tui-app/src/skeleton-keys.ts',
    'packages/bijou-tui-app/src/skeleton-overlays.ts',
    'packages/bijou-tui-app/src/skeleton-page.ts',
  ],
} as const satisfies Readonly<Record<
  (typeof TRANCHE_B_ROOTS)[number],
  readonly string[]
>>;
