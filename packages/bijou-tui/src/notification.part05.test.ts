import { describe, expect, it } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { stripAnsi } from './viewport.js';
import { createNotificationState, dismissNotification, relocateNotifications, pushNotification, renderNotificationStack, trimNotificationsToViewport, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('renderNotificationStack', () => {
  it('moves existing overlays when the stack placement changes', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Movable',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
      }, 0);
      state = tickNotifications(state, 250);
      const [before] = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      const moved = relocateNotifications(state, 'UPPER_LEFT', 300);
      const [after] = renderNotificationStack(moved, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(after?.row).toBeLessThan(before?.row);
      expect(after?.col).toBeLessThan(before?.col);
      expect(moved.items[0]?.phase).toBe('entering');
    });

  it('starts entry animations fully off-screen for edge-anchored placements', () => {
      let leftState = createNotificationState<Msg>();
      leftState = pushNotification(leftState, {
        title: 'Off-screen left',
        variant: 'TOAST',
        placement: 'UPPER_LEFT',
        durationMs: null,
      }, 0);
      const [leftOverlay] = renderNotificationStack(leftState, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(leftOverlay?.surface).toBeDefined();
      const leftOverlayBounds = must(leftOverlay);
      expect(leftOverlayBounds.col + must(leftOverlayBounds.surface).width).toBeLessThanOrEqual(0);
      let rightState = createNotificationState<Msg>();
      rightState = pushNotification(rightState, {
        title: 'Off-screen right',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      const [rightOverlay] = renderNotificationStack(rightState, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(rightOverlay).toBeDefined();
      expect(rightOverlay?.col).toBeGreaterThanOrEqual(90);
    });

  it('keeps a dismissed notification on-screen long enough to animate out', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Animated exit',
        message: 'This notice should slide out instead of disappearing immediately.',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      const [visible] = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      state = dismissNotification(state, state.items[0]?.id, 300);
      const [dismissed] = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(dismissed).toBeDefined();
      state = tickNotifications(state, 360);
      const [animating] = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(animating).toBeDefined();
      expect(animating?.col).toBeGreaterThanOrEqual(visible?.col);
      state = tickNotifications(state, 700);
      const overlays = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(overlays).toHaveLength(0);
    });

  it('slides dismissed notifications fully off-screen before archiving them', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Exit to the right',
        message: 'This should travel all the way off-screen before removal.',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      state = dismissNotification(state, state.items[0]?.id, 300);
      state = tickNotifications(state, 619);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      expect(overlay).toBeDefined();
      expect(overlay?.col).toBeGreaterThanOrEqual(90);
      expect(state.items[0]?.phase).toBe('exiting');
    });

  it('renders overflowed notifications through an exit lane before archiving them', () => {
      let state = createNotificationState<Msg>();
      for (let index = 0; index < 5; index++) {
        state = pushNotification(state, {
          title: `Overflow ${String(index + 1)}`,
          message: 'Older notices should animate out when newer ones force them away.',
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
      const overlays = renderNotificationStack(state, {
        screenWidth: 48,
        screenHeight: 12,
      });
      expect(state.overflowExits.length).toBeGreaterThan(0);
      expect(overlays.some((overlay) => stripAnsi(overlay.content).includes('Overflow 1'))).toBe(true);
      state = tickNotifications(state, 900);
      expect(state.history.some((item) => item.title === 'Overflow 1')).toBe(true);
    });
});
