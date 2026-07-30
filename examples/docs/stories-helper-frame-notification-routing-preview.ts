import { badgeSurface, boxSurface, column, compositeSurface, createNotificationState, line, mutedText, pushNotification, renderNotificationStack, row, screenSurface, spacer, tickNotifications } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function frameNotificationRoutingPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
  } = input;
  const nowMs = 1_710_000_002_000;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      'frame runtime notifications',
      '[WARNING] Runtime issue routed',
      'Command rejected: worker crashed during boot',
      '',
      '[SUCCESS] Saved draft',
      'Frame-managed notification from the page update',
      '',
      'Footer cue: notices:2',
    ].join('\n');
  }

  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Runtime issue routed',
    message: 'Command rejected: worker crashed during boot',
    variant: 'INLINE',
    tone: 'WARNING',
    placement: 'TOP_CENTER',
  }, nowMs);
  state = pushNotification(state, {
    title: 'Saved draft',
    message: 'Frame-managed notification from the page update',
    variant: 'TOAST',
    tone: 'SUCCESS',
    placement: 'TOP_CENTER',
  }, nowMs + 40);
  state = tickNotifications(state, nowMs + 500);

  const screenWidth = Math.max(52, Math.min(width, 68));
  const screenHeight = 14;
  const background = screenSurface(
    screenWidth,
    screenHeight,
    boxSurface(column([
      row(['frame shell  ', badgeSurface('notices:2', 'warning', ctx)]),
      spacer(),
      line('page:home pane:main', screenWidth - 6),
      line(mutedText(ctx, 'Runtime warnings and page notify() commands route through the shell.'), screenWidth - 6),
      spacer(),
      line('footer: [NORMAL] page:home pane:main notices:2', screenWidth - 6),
    ]), {
      title,
      width: Math.max(38, screenWidth - 4),
      ctx,
    }),
    1,
    1,
  );

  return compositeSurface(background, renderNotificationStack(state, {
    screenWidth,
    screenHeight,
    ctx,
    margin: 1,
    gap: 1,
  }));
}
