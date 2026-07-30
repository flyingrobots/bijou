import type { BijouContext } from '@flyingrobots/bijou';
import { box, progressBar, separator, table } from '@flyingrobots/bijou';
import { statusBar } from '@flyingrobots/bijou-tui';
import type { WorkbenchPageModel } from './canonical-app-contract.js';
import {
  INCIDENT_FEED,
  RELEASES,
  SERVICE_HEALTH,
} from './canonical-app-fixtures.js';
import { serviceBadge, tag, toFixedHeight } from './canonical-app-format.js';
import { clampIndex } from './canonical-app-model.js';

export function renderOpsSummary(
  width: number,
  height: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const release =
    RELEASES[clampIndex(model.releaseIndex, RELEASES.length)] ?? RELEASES[0];
  const trackWidth = Math.max(8, Math.min(34, width - 12));
  const drawerState = model.drawerOpen ? 'open' : 'closed';
  const lines = [
    `Active train ${release.id}`,
    `Window: ${release.window}`,
    `ETA: ${release.eta}`,
    `${tag(`${String(release.readiness)}% ready`)} checks:${String(release.failedChecks)} incidents:${String(release.incidents)}`,
    progressBar(release.readiness, { width: trackWidth, ctx }),
    `Inspector drawer: ${drawerState} (${model.drawerAnchor})`,
    'o toggle drawer, a cycle anchor, y cycle target',
    'ctrl+p or : palette, ? help',
    'q or esc request quit, enter confirm',
    statusBar({
      left: 'n/b release',
      center: 'drawer = panel inspector',
      right: `target #${String(model.drawerTargetIndex + 1)}`,
      width: Math.max(10, width - 4),
      fillChar: ' ',
    }),
  ];

  return box(toFixedHeight(lines, Math.max(0, height - 2)).join('\n'), {
    width,
    bgToken: ctx.surface('secondary'),
    borderToken: ctx.border('primary'),
    ctx,
  });
}

export function renderOpsHealth(width: number, ctx: BijouContext): string {
  const rows = SERVICE_HEALTH.map((service) => [
    service.name,
    `${String(service.p95Ms)}ms`,
    service.errorRate,
    serviceBadge(service.status),
  ]);

  return box(
    [
      separator({
        label: 'Service Health',
        width: Math.max(8, width - 4),
        ctx,
      }),
      table({
        columns: [
          { header: 'service', width: 14 },
          { header: 'p95', width: 8 },
          { header: 'error', width: 8 },
          { header: 'status', width: 10 },
        ],
        rows,
        ctx,
      }),
      '',
      'Use frame scroll keys (j/k/d/u/g/G) per focused pane.',
    ].join('\n'),
    { width, ctx },
  );
}

export function renderIncidentFeed(
  width: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const selected = clampIndex(model.incidentIndex, INCIDENT_FEED.length);
  const lines = INCIDENT_FEED.map((line, index) =>
    index === selected ? `${tag('focus')} ${line}` : `        ${line}`,
  );
  const legend = statusBar({
    left: '., incident',
    center: 'tab/shift+tab pane focus',
    right: `${String(selected + 1)}/${String(INCIDENT_FEED.length)}`,
    width: Math.max(10, width - 4),
  });

  return box(
    [
      separator({ label: 'Incident Feed', width: Math.max(8, width - 4), ctx }),
      ...lines,
      '',
      legend,
    ].join('\n'),
    {
      width,
      borderToken: ctx.border('muted'),
      ctx,
    },
  );
}
