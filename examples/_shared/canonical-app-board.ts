import type { BijouContext } from '@flyingrobots/bijou';
import { box, kbd, separator, timeline } from '@flyingrobots/bijou';
import type { WorkbenchPageModel } from './canonical-app-contract.js';
import { BACKLOG, RUNBOOK } from './canonical-app-fixtures.js';
import { statusBadge } from './canonical-app-format.js';
import { clampIndex } from './canonical-app-model.js';

export function renderBoardLanes(width: number, ctx: BijouContext): string {
  const laneLines = (
    [
      ['Todo', 'todo'],
      ['Doing', 'doing'],
      ['Blocked', 'blocked'],
      ['Done', 'done'],
    ] as const
  ).flatMap(([label, status], index) => {
    const items = BACKLOG.filter((item) => item.status === status);
    const heading = `${label.padEnd(7)} ${String(items.length)}`;
    const lines = items.map((item) => `  ${item.id} ${item.title}`);
    return index === 0 ? [heading, ...lines] : ['', heading, ...lines];
  });

  return box(
    [
      separator({ label: 'Backlog Lanes', width: Math.max(8, width - 4), ctx }),
      ...laneLines,
    ].join('\n'),
    { width, ctx },
  );
}

export function renderBoardTicket(
  width: number,
  model: WorkbenchPageModel,
  ctx: BijouContext,
): string {
  const selected =
    BACKLOG[clampIndex(model.backlogIndex, BACKLOG.length)] ?? BACKLOG[0];

  return box(
    [
      separator({
        label: `Ticket ${selected.id}`,
        width: Math.max(8, width - 4),
        ctx,
      }),
      `${statusBadge(selected.status)} ${selected.title}`,
      `Owner: ${selected.owner}`,
      '',
      'Acceptance:',
      '- no overlay bleed outside panel bounds',
      '- pane-scoped drawers honor top/bottom anchors',
      '- command palette merges frame/global/page actions',
      '',
      'Debug command:',
      'pnpm test -- packages/bijou-tui/src/app-frame.test.ts',
      '',
      `Hints: ${kbd('tab', { ctx })} pane focus • ${kbd('h/l', { ctx })} horizontal scroll`,
    ].join('\n'),
    {
      width,
      borderToken: ctx.border('primary'),
      ctx,
    },
  );
}

export function renderBoardRunbook(width: number, ctx: BijouContext): string {
  const events = RUNBOOK.map((step, index) => ({
    label: step,
    status:
      index < 2
        ? ('success' as const)
        : index === 2
          ? ('active' as const)
          : ('muted' as const),
  }));

  return box(
    [
      separator({
        label: 'Release Runbook',
        width: Math.max(8, width - 4),
        ctx,
      }),
      timeline(events, { ctx }),
    ].join('\n'),
    {
      width,
      bgToken: ctx.surface('secondary'),
      ctx,
    },
  );
}
