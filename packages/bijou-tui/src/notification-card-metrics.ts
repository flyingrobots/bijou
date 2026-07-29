import { forceTextPresentation } from './icon-presentation.js';
import type { NotificationRecord, NotificationTone } from './notification.js';
import { visibleLength } from './viewport.js';

const TONE_ICONS: Readonly<Record<NotificationTone, string>> = {
  INFO: forceTextPresentation('\u2139'),
  SUCCESS: forceTextPresentation('\u2714'),
  WARNING: forceTextPresentation('\u26a0'),
  ERROR: forceTextPresentation('\u2718'),
};
const TONE_BORDER_KEYS: Readonly<
  Record<NotificationTone, 'primary' | 'success' | 'warning' | 'error'>
> = {
  INFO: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export function notificationToneIcon(tone: NotificationTone): string {
  return TONE_ICONS[tone];
}

export function notificationToneBorderKey(
  tone: NotificationTone,
): 'primary' | 'success' | 'warning' | 'error' {
  return TONE_BORDER_KEYS[tone];
}

export function measureNotificationTextWidth<Msg>(
  item: NotificationRecord<Msg>,
  screenWidth: number,
): number {
  const available = Math.max(18, screenWidth - 7);
  if (item.width != null) {
    return Math.max(18, Math.min(available, item.width));
  }
  const actionWidth =
    item.action == null ? 0 : visibleLength(item.action.label) + 6;
  const base = Math.max(
    visibleLength(item.title) + 8,
    visibleLength(item.message) + 2,
    actionWidth + 2,
  );
  if (item.variant === 'INLINE') {
    return Math.min(
      available,
      Math.max(28, Math.max(base + 8, Math.floor(screenWidth * 0.66))),
    );
  }
  return Math.min(available, Math.max(26, Math.min(52, base + 6)));
}
