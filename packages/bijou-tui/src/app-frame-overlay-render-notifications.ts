import {
  createSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { ResolvedFrameNotificationCenter } from './app-frame-overlay-contract.js';
import {
  frameMessage,
  frameNotificationFilterLabel,
} from './app-frame-i18n.js';
import { insetLineSurface } from './collection-surface.js';
import {
  renderNotificationHistorySurface,
  renderNotificationReviewEntrySurface,
  type NotificationHistoryLabels,
} from './notification.js';
import { vstackSurface } from './surface-layout.js';

export function renderNotificationCenterSurface<Msg>(
  center: ResolvedFrameNotificationCenter<Msg>,
  width: number,
  i18n?: I18nRuntime,
  ctx?: BijouContext,
): Surface {
  const labels = notificationHistoryLabels(i18n);
  const rows: Surface[] = [
    insetLineSurface(
      frameMessage(
        i18n,
        'notifications.summary.liveArchived',
        'Live: {liveCount} • Archived: {archivedCount}',
        {
          liveCount: center.state.items.length,
          archivedCount: center.state.history.length,
        },
      ),
      width,
    ),
    insetLineSurface(
      frameMessage(
        i18n,
        'notifications.summary.filter',
        'Filter: {filter}',
        {
          filter: frameNotificationFilterLabel(i18n, center.activeFilter),
        },
      ),
      width,
    ),
  ];
  const liveItems = [...center.state.items].sort(
    (left, right) =>
      right.updatedAtMs - left.updatedAtMs || right.id - left.id,
  );
  if (liveItems.length > 0) {
    rows.push(createSurface(width, 1));
    const heading = frameMessage(
      i18n,
      'notifications.currentStack',
      'Current stack',
    );
    rows.push(insetLineSurface(ctx == null ? heading : ctx.style.bold(heading), width));
    rows.push(createSurface(width, 1));
    for (const [index, item] of liveItems.entries()) {
      rows.push(
        renderNotificationReviewEntrySurface(item, {
          width,
          ctx,
          actionLabel: labels.actionLabel,
          metaLabel: `${item.variant} • live`,
        }),
      );
      if (index < liveItems.length - 1) rows.push(createSurface(width, 1));
    }
  }
  rows.push(createSurface(width, 1));
  rows.push(
    renderNotificationHistorySurface(center.state, {
      width,
      height: Number.MAX_SAFE_INTEGER,
      filter: center.activeFilter,
      ctx,
      labels,
    }),
  );
  return vstackSurface(...rows);
}

function notificationHistoryLabels(
  i18n: I18nRuntime | undefined,
): NotificationHistoryLabels {
  return {
    filterLabel: (filter) => frameNotificationFilterLabel(i18n, filter),
    headerLabel: ({ filterLabel, start, end, total }) =>
      frameMessage(
        i18n,
        'notifications.history.title',
        'History • {filter} • {range}',
        {
          filter: filterLabel,
          range:
            total === 0
              ? frameMessage(
                  i18n,
                  'notifications.history.range.empty',
                  '0 items',
                )
              : frameMessage(
                  i18n,
                  'notifications.history.range.window',
                  '{start}-{end} of {total}',
                  { start, end, total },
                ),
        },
      ),
    emptyLabel: ({ filterLabel }) =>
      frameMessage(
        i18n,
        'notifications.history.empty',
        'No archived notifications for {filter} yet.',
        { filter: filterLabel },
      ),
    actionLabel: (label) =>
      frameMessage(
        i18n,
        'notifications.history.action',
        'Action: {label}',
        { label },
      ),
  };
}
