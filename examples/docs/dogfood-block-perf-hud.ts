import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

export interface PerfHudBlockConfig {
  readonly fps?: number;
  readonly frameMs?: number;
  readonly columns?: number;
  readonly rows?: number;
}

export const perfHudMetricsRequirement = defineDataRequirement({
  id: 'perf-hud.metrics',
  resource: 'dogfood.perfHud.metrics',
  label: 'Performance metrics',
  description: 'Frame timing metrics visible in the DOGFOOD perf HUD.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
});

export const perfHudViewportRequirement = defineDataRequirement({
  id: 'perf-hud.viewport',
  resource: 'dogfood.perfHud.viewport',
  label: 'Viewport size',
  description: 'Current DOGFOOD terminal viewport size shown in diagnostics.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
});

export const perfHudData = defineViewData({
  id: 'perf-hud.data',
  label: 'PerfHudBlock data',
  description: 'DOGFOOD frame timing and viewport diagnostics.',
  requirements: [
    { name: 'metrics', requirement: perfHudMetricsRequirement },
    { name: 'viewport', requirement: perfHudViewportRequirement },
  ],
});

export const perfHudToggleIntent = commandIntent('perfHud.toggle', {
  label: 'Toggle perf HUD',
  description: 'Request the DOGFOOD perf HUD to open or close.',
  facts: [{ kind: 'entity', key: 'dogfood.command', value: 'PerfHudBlock' }],
});

export const perfHudBlock: BlockDefinition<PerfHudBlockConfig, string> = defineBlock({
  metadata: {
    packageName: DOGFOOD_BLOCK_PACKAGE,
    blockName: 'PerfHudBlock',
    family: 'dogfood-diagnostics',
    scale: 'panel',
    modes: DOGFOOD_BLOCK_MODES,
    docs: {
      summary: 'Owns the DOGFOOD performance HUD diagnostics contract.',
      useWhen: ['DOGFOOD needs inspectable timing and viewport diagnostics.'],
      avoidWhen: ['A page needs product content rather than frame diagnostics.'],
      relatedDocs: ['docs/DOGFOOD.md'],
    },
    sourcePath: 'packages/bijou-tui/src/app-frame.ts',
    slots: [
      { id: 'metrics', required: true, description: 'Timing metrics.' },
      { id: 'viewport', required: true, description: 'Viewport dimensions.' },
    ],
    variants: [
      {
        id: 'hud',
        label: 'HUD',
        requiredSlots: ['metrics', 'viewport'],
        facts: [{ kind: 'state', key: 'dogfood.perfHud.surface', value: 'hud' }],
      },
    ],
    composedComponents: ['renderFramePerfHudOverlay()'],
    semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' }],
    storyIds: ['perf-hud.hud'],
    examples: [{ id: 'dogfood.perfHud', label: 'DOGFOOD perf HUD' }],
    tags: ['dogfood', 'diagnostics', 'frame'],
  },
  data: perfHudData,
  commands: [perfHudToggleIntent],
  render: renderPerfHudBlock,
});

function renderPerfHudBlock(
  input: BlockRenderInput<PerfHudBlockConfig>,
): BlockRenderResult<string> {
  const fps = input.config?.fps ?? 0;
  const frameMs = input.config?.frameMs ?? 0;
  const columns = input.config?.columns ?? 0;
  const rows = input.config?.rows ?? 0;
  const frameLabel = frameMs.toFixed(2).replace(/\.?0+$/, '');

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Perf HUD fps: ${s(fps)}; frame: ${frameLabel} ms; size: ${s(columns)}x${s(rows)}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' },
        { kind: 'state', key: 'dogfood.perfHud.fps', value: s(fps) },
      ],
    };
  }

  return {
    output: [
      'PerfHudBlock',
      `fps: ${s(fps)}`,
      `frame: ${frameLabel} ms`,
      `size: ${s(columns)}x${s(rows)}`,
      'Intents: toggle perf HUD',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'PerfHudBlock' },
      { kind: 'state', key: 'dogfood.perfHud.fps', value: s(fps) },
    ],
  };
}
