import { badgeSurface, boxSurface, column, compositeSurface, createNotificationState, line, mutedText, pushNotification, renderNotificationStack, row, screenSurface, spacer, tickNotifications } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function transientAppNotificationPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'actionable' | 'mixed';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const nowMs = 1_710_000_001_000;

  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Deploy approval ready',
    message: 'The canary stayed green for 20 minutes.',
    variant: mode === 'actionable' ? 'ACTIONABLE' : 'INLINE',
    tone: 'SUCCESS',
    placement: 'UPPER_RIGHT',
    action: { label: 'Promote rollout', payload: 'promote' },
  }, nowMs);
  state = pushNotification(state, {
    title: mode === 'actionable' ? 'Queue drift detected' : 'Release notes synced',
    message: mode === 'actionable'
      ? 'Rollback remains available if latency climbs again.'
      : 'Support docs now match the promoted build.',
    variant: 'TOAST',
    tone: mode === 'actionable' ? 'WARNING' : 'INFO',
    placement: 'LOWER_RIGHT',
  }, nowMs + 40);
  state = tickNotifications(state, nowMs + 500);

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '[SUCCESS] Deploy approval ready',
      'Action: Promote rollout',
      '',
      mode === 'actionable'
        ? '[WARNING] Queue drift detected'
        : '[INFO] Release notes synced',
    ].join('\n');
  }

  const screenWidth = Math.max(48, Math.min(width, 64));
  const screenHeight = 13;
  const background = screenSurface(
    screenWidth,
    screenHeight,
    boxSurface(column([
      row(['release coordinator  ', badgeSurface(mode === 'actionable' ? 'READY' : 'SYNCED', 'info', ctx)]),
      spacer(),
      line('App-owned notifications can stack by tone and placement.', screenWidth - 6),
      line(mutedText(ctx, 'This family is about transient app events, not archived review history.'), screenWidth - 6),
    ]), {
      title,
      width: Math.max(34, screenWidth - 4),
      ctx,
    }),
    1,
    2,
  );

  return compositeSurface(background, renderNotificationStack(state, {
    screenWidth,
    screenHeight,
    ctx,
    margin: 1,
  }));
}
