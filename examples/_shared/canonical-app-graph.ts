import type { BijouContext } from '@flyingrobots/bijou';
import { box, dag, separator, timeline } from '@flyingrobots/bijou';
import {
  GRAPH_SELECTION_IDS,
  type WorkbenchPageModel,
} from './canonical-app-contract.js';
import { DEPLOY_GRAPH, RELEASES } from './canonical-app-fixtures.js';
import { clampIndex } from './canonical-app-model.js';

function activeRelease(model: WorkbenchPageModel) {
  return (
    RELEASES[clampIndex(model.releaseIndex, RELEASES.length)] ?? RELEASES[0]
  );
}

export function renderGraphDag(
  width: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const release = activeRelease(model);
  const selectedId =
    GRAPH_SELECTION_IDS[
      clampIndex(model.graphSelectionIndex, GRAPH_SELECTION_IDS.length)
    ] ?? 'frame';
  const graph = dag(DEPLOY_GRAPH, {
    selectedId,
    highlightPath: ['plan', 'split', 'frame', 'overlays', 'release'],
    maxWidth: Math.max(50, width * 2),
    ctx,
  });

  return box(
    [
      separator({
        label: `Dependency Graph ${release.id}`,
        width: Math.max(8, width - 4),
        ctx,
      }),
      graph,
      '',
      'Tip: focus this pane then use h/l to inspect long graph rows.',
    ].join('\n'),
    { width, ctx },
  );
}

export function renderGraphTimeline(
  width: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const release = activeRelease(model);
  const events = [
    {
      label: 'API freeze',
      description: `${release.id} candidate locked`,
      status: 'success' as const,
    },
    {
      label: 'Canary rollout',
      description: '10 percent ring active',
      status: 'active' as const,
    },
    {
      label: 'Perf soak',
      description: 'Watch p95 + error budgets',
      status: 'warning' as const,
    },
    {
      label: 'Global rollout',
      description: 'Awaiting gate approval',
      status: 'muted' as const,
    },
  ];

  return box(
    [
      separator({ label: 'Timeline', width: Math.max(8, width - 4), ctx }),
      timeline(events, { ctx }),
    ].join('\n'),
    { width, ctx },
  );
}

export function renderGraphNotes(
  width: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const release = activeRelease(model);

  return box(
    [
      separator({
        label: 'Operator Notes',
        width: Math.max(8, width - 4),
        ctx,
      }),
      `Release: ${release.id}`,
      `Window: ${release.window}`,
      '',
      'This canonical demo intentionally exercises:',
      '- appFrame tab chrome + help + command palette',
      '- grid and nested split layouts',
      '- panel-scoped drawers with all anchors',
      '- per-pane scroll isolation and horizontal overflow',
    ].join('\n'),
    {
      width,
      bgToken: ctx.surface('muted'),
      ctx,
    },
  );
}
