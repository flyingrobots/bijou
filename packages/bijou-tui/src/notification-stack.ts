import { surfaceToString } from '@flyingrobots/bijou';
import type { Overlay } from './overlay.js';
import type { LayoutRect } from './layout-rect.js';
import { renderPlainSurface, type NotificationMouseTarget, type NotificationState, type RenderNotificationStackOptions } from './notification.js';
import { resolveNotificationOverlayEntries } from './notification-stack-layout.js';

export { trimNotificationsToViewport } from './notification-stack-trim.js';

function containsRect(rect: LayoutRect | undefined, col: number, row: number): boolean {
  if (rect == null) return false;
  return col >= rect.col
    && col < rect.col + rect.width
    && row >= rect.row
    && row < rect.row + rect.height;
}

export function hitTestNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
  col: number,
  row: number,
): NotificationMouseTarget<Msg> | undefined {
  const entries = resolveNotificationOverlayEntries(state, options);
  for (const entry of [...entries].reverse()) {
    if (
      col < entry.col
      || col >= entry.col + entry.surface.width
      || row < entry.row
      || row >= entry.row + entry.surface.height
    ) {
      continue;
    }

    const localCol = col - entry.col;
    const localRow = row - entry.row;
    if (containsRect(entry.dismissRect, localCol, localRow)) {
      return { item: entry.item, kind: 'dismiss' };
    }
    if (containsRect(entry.actionRect, localCol, localRow)) {
      return { item: entry.item, kind: 'action' };
    }
    return { item: entry.item, kind: 'body' };
  }

  return undefined;
}

export function renderNotificationStack<Msg>(
  state: NotificationState<Msg>,
  options: RenderNotificationStackOptions,
): readonly Overlay[] {
  return resolveNotificationOverlayEntries(state, options).map((entry) => ({
    row: entry.row,
    col: entry.col,
    surface: entry.surface,
    content: options.ctx != null
      ? surfaceToString(entry.surface, options.ctx.style)
      : renderPlainSurface(entry.surface),
  }));
}
