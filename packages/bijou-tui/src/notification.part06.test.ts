import { describe, expect, it } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createNotificationState, pushNotification, renderNotificationStack, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('renderNotificationStack', () => {
  it('keeps the card background applied across the full notification surface', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Deploy failed',
        message: 'Worker boot retries are exhausted.',
        variant: 'ACTIONABLE',
        tone: 'ERROR',
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 7 } },
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
        ctx,
      });
      expect(overlay?.surface).toBeDefined();
      const surface = must(must(overlay).surface);
      const expectedBg = surface.get(1, 0).bg;
      expect(expectedBg).toBeDefined();
      for (let y = 0; y < surface.height; y++) {
        expect(surface.get(1, y).bg).toBe(expectedBg);
        expect(surface.get(surface.width - 1, y).bg).toBe(expectedBg);
        expect(surface.get(Math.max(2, surface.width - 2), y).bg).toBe(expectedBg);
      }
    });
});
