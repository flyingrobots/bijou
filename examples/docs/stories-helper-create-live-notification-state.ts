import { createNotificationState, pushNotification, tickNotifications } from './stories-runtime.js';

export function createLiveNotificationState(nowMs: number) {
  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Canary ready',
    message: 'eu-west has stayed green for 15 minutes.',
    variant: 'ACTIONABLE',
    tone: 'SUCCESS',
    placement: 'UPPER_RIGHT',
    action: { label: 'Promote rollout', payload: 'promote' },
  }, nowMs);
  state = pushNotification(state, {
    title: 'Queue drift detected',
    message: 'Retry backlog is trending upward in the worker pool.',
    variant: 'TOAST',
    tone: 'WARNING',
    placement: 'LOWER_RIGHT',
  }, nowMs + 20);
  return tickNotifications(state, nowMs + 500);
}
