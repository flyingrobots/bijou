import type { NotificationRenderEntry } from './notification-card.js';
import type { NotificationPlacement, NotificationRecord } from './notification.js';

export interface PositionedNotificationRenderEntry<Msg> extends NotificationRenderEntry<Msg> {
  readonly row: number;
  readonly col: number;
}

export function sortForPlacement<Msg>(
  items: readonly NotificationRecord<Msg>[],
  placement: NotificationPlacement,
): readonly NotificationRecord<Msg>[] {
  const ordered = [...items].sort((left, right) => right.createdAtMs - left.createdAtMs || right.id - left.id);
  return placementSortSign(placement) === 'bottom' ? ordered.reverse() : ordered;
}

export function placementSortSign(placement: NotificationPlacement): 'top' | 'bottom' | 'center' {
  switch (placement) {
    case 'UPPER_LEFT':
    case 'UPPER_RIGHT':
    case 'TOP_CENTER':
      return 'top';
    case 'LOWER_LEFT':
    case 'LOWER_RIGHT':
    case 'BOTTOM_CENTER':
      return 'bottom';
    case 'CENTER':
      return 'center';
  }
}

export function anchoredCol(placement: NotificationPlacement, width: number, screenWidth: number, margin: number): number {
  switch (placement) {
    case 'UPPER_LEFT':
    case 'LOWER_LEFT':
      return margin;
    case 'UPPER_RIGHT':
    case 'LOWER_RIGHT':
      return Math.max(margin, screenWidth - width - margin);
    case 'TOP_CENTER':
    case 'BOTTOM_CENTER':
    case 'CENTER':
      return Math.max(0, Math.floor((screenWidth - width) / 2));
  }
}

export function applyAnimationOffset(
  placement: NotificationPlacement,
  width: number,
  height: number,
  margin: number,
  progress: number,
): { readonly rowDelta: number; readonly colDelta: number } {
  const remaining = 1 - progress;
  const slideX = Math.round(remaining * (width + margin));
  const slideY = Math.round(remaining * (height + margin));

  switch (placement) {
    case 'UPPER_LEFT':
    case 'LOWER_LEFT':
      return { rowDelta: 0, colDelta: -slideX };
    case 'UPPER_RIGHT':
    case 'LOWER_RIGHT':
      return { rowDelta: 0, colDelta: slideX };
    case 'TOP_CENTER':
      return { rowDelta: -slideY, colDelta: 0 };
    case 'BOTTOM_CENTER':
      return { rowDelta: slideY, colDelta: 0 };
    case 'CENTER':
      return { rowDelta: -slideY, colDelta: 0 };
  }
}
