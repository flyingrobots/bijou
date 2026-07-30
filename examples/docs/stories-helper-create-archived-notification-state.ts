import { createNotificationState, dismissNotification, pushNotification, tickNotifications } from './stories-runtime.js';

export function createArchivedNotificationState(nowMs: number) {
  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Deploy blocked',
    message: 'The runtime failed to boot the latest candidate.',
    variant: 'ACTIONABLE',
    tone: 'ERROR',
    placement: 'UPPER_RIGHT',
    action: { label: 'Retry deploy', payload: 'retry' },
  }, nowMs);
  state = pushNotification(state, {
    title: 'Background sync ready',
    message: 'Fresh reference data is available for review.',
    variant: 'INLINE',
    tone: 'INFO',
    placement: 'LOWER_RIGHT',
  }, nowMs + 20);
  state = tickNotifications(state, nowMs + 500);
  state = dismissNotification(state, 1, nowMs + 900);
  state = dismissNotification(state, 2, nowMs + 920);
  return tickNotifications(state, nowMs + 1_400);
}
