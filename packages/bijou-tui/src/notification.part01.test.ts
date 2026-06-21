import { describe, expect, it } from 'vitest';
import { stripAnsi } from './viewport.js';
import { activateFocusedNotification, countNotificationHistory, createNotificationState, cycleNotificationFocus, dismissNotification, relocateNotifications, notificationsNeedTick, pushNotification, renderNotificationHistory, trimNotificationsToViewport, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('notification state', () => {
  it('honors an explicit persistent duration override', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Pinned toast',
        variant: 'TOAST',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 200);
      expect(state.items[0]?.phase).toBe('visible');
      state = tickNotifications(state, 25_000);
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.phase).toBe('visible');
      expect(notificationsNeedTick(state)).toBe(false);
    });

  it('auto-dismisses toast notifications after the default duration', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Build complete',
        variant: 'TOAST',
      }, 0);
      state = tickNotifications(state, 200);
      expect(state.items[0]?.phase).toBe('visible');
      state = tickNotifications(state, 4_300);
      expect(state.items[0]?.phase).toBe('exiting');
      state = tickNotifications(state, 4_700);
      expect(state.items).toHaveLength(0);
      expect(state.history).toHaveLength(1);
      expect(state.history[0]?.title).toBe('Build complete');
    });

  it('cycles actionable focus and activates the focused action payload', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'First',
        variant: 'ACTIONABLE',
        action: { label: 'Retry first', payload: { type: 'retry', id: 1 } },
      }, 0);
      state = pushNotification(state, {
        title: 'Second',
        variant: 'ACTIONABLE',
        action: { label: 'Retry second', payload: { type: 'retry', id: 2 } },
      }, 10);
      expect(state.focusedId).toBe(2);
      state = cycleNotificationFocus(state, -1);
      expect(state.focusedId).toBe(1);
      const result = activateFocusedNotification(state, 100);
      expect(result.payload).toEqual({ type: 'retry', id: 1 });
      expect(result.state.items.find((item) => item.id === 1)?.phase).toBe('exiting');
    });

  it('can relocate the active stack to a new placement', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'First',
        placement: 'LOWER_RIGHT',
      }, 0);
      state = pushNotification(state, {
        title: 'Second',
        placement: 'LOWER_RIGHT',
      }, 10);
      state = relocateNotifications(state, 'TOP_CENTER');
      expect(state.items.every((item) => item.placement === 'TOP_CENTER')).toBe(true);
    });

  it('trims the oldest active notifications when the viewport runs out of room', () => {
      let state = createNotificationState<Msg>();
      for (let index = 0; index < 5; index++) {
        state = pushNotification(state, {
          title: `Notice ${String(index + 1)}`,
          message: 'Stack trimming keeps the newest notifications visible.',
          variant: 'TOAST',
          placement: 'LOWER_RIGHT',
          durationMs: null,
        }, index * 10);
      }
      state = tickNotifications(state, 500);
      state = trimNotificationsToViewport(state, {
        screenWidth: 48,
        screenHeight: 12,
        margin: 1,
        gap: 1,
      }, 500);
      expect(state.items.length).toBeLessThan(5);
      expect(state.items.some((item) => item.title === 'Notice 5')).toBe(true);
      expect(state.overflowExits.some((item) => item.title === 'Notice 1')).toBe(true);
      state = tickNotifications(state, 900);
      expect(state.history.some((item) => item.title === 'Notice 1')).toBe(true);
    });

  it('counts and renders archived notification history with filters', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Archived info',
        message: 'Informational trail entry.',
        variant: 'TOAST',
        tone: 'INFO',
        durationMs: null,
      }, 0);
      state = pushNotification(state, {
        title: 'Archived action',
        message: 'Needs follow-up.',
        variant: 'ACTIONABLE',
        tone: 'ERROR',
        durationMs: null,
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 42 } },
      }, 10);
      state = tickNotifications(state, 250);
      state = dismissNotification(state, state.items[0]?.id, 300);
      state = dismissNotification(state, state.items[1]?.id, 310);
      state = tickNotifications(state, 900);
      expect(countNotificationHistory(state)).toBe(2);
      expect(countNotificationHistory(state, 'ACTIONABLE')).toBe(1);
      expect(countNotificationHistory(state, 'ERROR')).toBe(1);
      const body = renderNotificationHistory(state, {
        width: 34,
        height: 8,
        filter: 'ACTIONABLE',
      });
      expect(stripAnsi(body)).toContain('History • Actionable • 1-1 of 1');
      expect(stripAnsi(body)).toContain('Archived action');
      expect(stripAnsi(body)).toContain('Retry deploy');
      expect(stripAnsi(body)).not.toContain('Archived info');
    });
});
