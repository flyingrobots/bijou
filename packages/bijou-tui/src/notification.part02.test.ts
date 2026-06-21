import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { stripAnsi } from './viewport.js';
import { countNotificationHistory, createNotificationState, dismissNotification, pushNotification, renderNotificationHistory, renderNotificationHistorySurface, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('notification state', () => {
  it('treats actionable history as the variant, not action presence', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Dismiss-only actionable',
        message: 'Archived without a custom action payload.',
        variant: 'ACTIONABLE',
        tone: 'WARNING',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      state = dismissNotification(state, state.items[0]?.id, 300);
      state = tickNotifications(state, 900);
      expect(countNotificationHistory(state, 'ACTIONABLE')).toBe(1);
      const body = renderNotificationHistory(state, {
        width: 28,
        height: 8,
        filter: 'ACTIONABLE',
      });
      expect(stripAnsi(body)).toMatch(/Dismiss-only\s*actionable/);
    });

  it('supports scrolling through archived notification history', () => {
      let state = createNotificationState<Msg>();
      for (let index = 0; index < 3; index++) {
        state = pushNotification(state, {
          title: `Archived ${String(index + 1)}`,
          message: 'Scrollable history entry.',
          variant: 'TOAST',
          durationMs: null,
        }, index * 10);
      }
      state = tickNotifications(state, 250);
      for (const item of state.items) {
        state = dismissNotification(state, item.id, 300 + item.id);
      }
      state = tickNotifications(state, 900);
      const body = renderNotificationHistory(state, {
        width: 28,
        height: 7,
        scroll: 1,
      });
      expect(stripAnsi(body)).toContain('History • All • 2-2 of 3');
      expect(stripAnsi(body)).toContain('Archived 2');
      expect(stripAnsi(body)).not.toContain('Archived 3');
    });

  it('renders archived multilingual history content through the review path without dropping wrapped fields', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: '選択中 😀 history',
        message: 'Lokalisierte Hinweise bleiben auch bei schmalen Flächen lesbar.',
        variant: 'ACTIONABLE',
        tone: 'WARNING',
        durationMs: null,
        action: { label: 'Weiter prüfen', payload: { type: 'ignore' } },
      }, 0);
      state = tickNotifications(state, 250);
      state = dismissNotification(state, state.items[0]?.id, 300);
      state = tickNotifications(state, 900);
      const body = renderNotificationHistory(state, {
        width: 20,
        height: 10,
        filter: 'ALL',
      });
      const plain = stripAnsi(body);
      expect(plain).toContain('History • All • 1-1 of 1');
      expect(plain).toContain('選択中 😀');
      expect(plain).toContain('history');
      expect(plain).toContain('Lokalisierte');
    });

  it('renders archived notification history as inset review rows in the surface path', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Archived action',
        message: 'Needs follow-up.',
        variant: 'ACTIONABLE',
        tone: 'ERROR',
        durationMs: null,
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 42 } },
      }, 0);
      state = tickNotifications(state, 250);
      state = dismissNotification(state, state.items[0]?.id, 300);
      state = tickNotifications(state, 900);
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = renderNotificationHistorySurface(state, {
        width: 34,
        height: 8,
        filter: 'ALL',
        ctx,
      });
      const lines = stripAnsi(surfaceToString(surface, ctx.style)).split('\n');
      const titleLine = lines.findIndex((line) => line.includes('Archived action'));
      const metaLine = lines.findIndex((line) => line.includes('ACTIONABLE'));
      const actionLine = lines.findIndex((line) => line.includes('Retry deploy'));
      expect(titleLine).toBeGreaterThan(1);
      expect(lines[titleLine]?.indexOf('Archived action')).toBeGreaterThan(0);
      expect(metaLine).toBe(titleLine + 1);
      expect(actionLine).toBeGreaterThan(metaLine);
    });
});
