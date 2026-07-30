import { badgeSurface, boxSurface, column, compositeSurface, line, mutedText, renderNotificationHistory, renderNotificationHistorySurface, renderNotificationStack, row, screenSurface, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { createArchivedNotificationState } from './stories-helper-create-archived-notification-state.js';
import { createLiveNotificationState } from './stories-helper-create-live-notification-state.js';

export function notificationPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'stack' | 'history';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const nowMs = 1_710_000_000_000;

  if (mode === 'history') {
    const historyState = createArchivedNotificationState(nowMs);
    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [
        title,
        '',
        renderNotificationHistory(historyState, {
          width: Math.max(32, Math.min(width, 56)),
          height: 10,
          filter: 'ALL',
          ctx,
        }),
      ].join('\n');
    }

    return boxSurface(renderNotificationHistorySurface(historyState, {
      width: Math.max(32, Math.min(width, 56)),
      height: 10,
      filter: 'ALL',
      ctx,
    }), {
      title,
      width: Math.max(36, Math.min(width, 60)),
      ctx,
    });
  }

  const liveState = createLiveNotificationState(nowMs);
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '[SUCCESS] Canary ready',
      'Action: Promote rollout',
      '',
      '[WARNING] Queue drift detected',
      'Retry backlog is trending upward in the worker pool.',
    ].join('\n');
  }

  const screenWidth = Math.max(48, Math.min(width, 64));
  const screenHeight = 14;
  const background = screenSurface(
    screenWidth,
    screenHeight,
    boxSurface(column([
      row(['release dashboard  ', badgeSurface('LIVE', 'success', ctx)]),
      spacer(),
      line('Window opens in 4m', screenWidth - 6),
      line(mutedText(ctx, 'The notification system owns transient events and archived review.'), screenWidth - 6),
    ]), {
      title,
      width: Math.max(32, screenWidth - 4),
      ctx,
    }),
    1,
    2,
  );

  return compositeSurface(background, renderNotificationStack(liveState, {
    screenWidth,
    screenHeight,
    ctx,
    margin: 1,
  }));
}
