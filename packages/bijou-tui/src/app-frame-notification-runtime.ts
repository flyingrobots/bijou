import type { OverflowBehavior } from '@flyingrobots/bijou';
import type { Cmd } from './types.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { FramedAppMsg } from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { NotificationPlacement } from './notification.js';

const FRAME_NOTIFICATION_TICK_MS = 40;
const DEFAULT_FRAME_NOTIFICATION_DURATION_MS = 6_000;

export interface ResolvedFrameNotificationOptions {
  readonly enabled: boolean;
  readonly placement: NotificationPlacement;
  readonly durationMs: number | null;
  readonly margin: number;
  readonly gap: number;
  readonly overflow: OverflowBehavior;
}

export function resolveFrameNotificationOptions<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): ResolvedFrameNotificationOptions {
  if (options.runtimeNotifications === false) {
    return {
      enabled: false,
      placement: 'LOWER_RIGHT',
      durationMs: DEFAULT_FRAME_NOTIFICATION_DURATION_MS,
      margin: 1,
      gap: 1,
      overflow: 'wrap',
    };
  }
  const configured =
    options.runtimeNotifications === true ||
    options.runtimeNotifications == null
      ? {}
      : options.runtimeNotifications;
  return {
    enabled: configured.enabled ?? true,
    placement: configured.placement ?? 'LOWER_RIGHT',
    durationMs:
      configured.durationMs ?? DEFAULT_FRAME_NOTIFICATION_DURATION_MS,
    margin: configured.margin ?? 1,
    gap: configured.gap ?? 1,
    overflow: configured.overflow ?? 'wrap',
  };
}

export function createFrameNotificationTickCmd<Msg>(): Cmd<
  FramedAppMsg<Msg>
> {
  return async (_emit, caps) => {
    if (!caps.sleep) {
      throw new Error(
        'createFrameNotificationTickCmd requires sleep capability',
      );
    }
    await caps.sleep(FRAME_NOTIFICATION_TICK_MS);
    return wrapFrameMsg({
      type: 'notification-tick',
      atMs: caps.now?.() ?? 0,
    });
  };
}
