import { describe, expect, it } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { stripAnsi } from './viewport.js';
import { createNotificationState, pushNotification, renderNotificationStack, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('renderNotificationStack', () => {
  it('stacks lower placements upward while keeping the newest notice nearest the anchor', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Older',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
      }, 0);
      state = pushNotification(state, {
        title: 'Newer',
        variant: 'TOAST',
        placement: 'LOWER_RIGHT',
      }, 100);
      state = tickNotifications(state, 400);
      const overlays = renderNotificationStack(state, {
        screenWidth: 90,
        screenHeight: 30,
      });
      const older = overlays.find((overlay) => stripAnsi(overlay.content).includes('Older'));
      const newer = overlays.find((overlay) => stripAnsi(overlay.content).includes('Newer'));
      expect(must(newer).row).toBeGreaterThan(must(older).row);
    });

  it('renders actionable notifications with a focused action affordance', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Deploy failed',
        message: 'The worker crashed before boot.',
        variant: 'ACTIONABLE',
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 7 } },
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      });
      expect(stripAnsi(overlay?.content)).toContain('[ Retry deploy ]');
    });

  it('preserves leading padding for unfocused actionable buttons', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Unfocused deploy',
        message: 'Kept visible behind the focused notification.',
        variant: 'ACTIONABLE',
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 7 } },
        durationMs: null,
      }, 0);
      state = pushNotification(state, {
        title: 'Focused deploy',
        message: 'Newest actionable notification owns focus.',
        variant: 'ACTIONABLE',
        action: { label: 'Open logs', payload: { type: 'ignore' } },
        durationMs: null,
      }, 10);
      state = tickNotifications(state, 250);
      const overlays = renderNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      });
      const unfocused = overlays.find((overlay) => stripAnsi(overlay.content).includes('Unfocused deploy'));
      if (unfocused == null) {
        throw new Error('expected unfocused actionable notification overlay');
      }
      const actionLine = stripAnsi(unfocused.content).split('\n')
        .find((line) => line.includes('Retry deploy'));
      if (actionLine == null) {
        throw new Error('expected unfocused actionable notification action row');
      }
      const labelStart = actionLine.indexOf('Retry deploy');
      expect(actionLine).not.toContain('[ Retry deploy ]');
      expect(actionLine.slice(labelStart - 2, labelStart)).toBe('  ');
    });

  it('renders multilingual actionable stack entries without losing wrapped title or action text', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: '選択中 😀 deploy review',
        message: 'Lokalisierte Hinweise bleiben in der Overlay-Karte lesbar.',
        variant: 'ACTIONABLE',
        action: { label: 'Weiter prüfen', payload: { type: 'ignore' } },
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 44,
        screenHeight: 14,
      });
      const plain = stripAnsi(overlay?.content);
      expect(plain).toContain('選択中 😀');
      expect(plain).toContain('deploy');
      expect(plain).toContain('Weiter prüfen');
    });

  it('honors an explicit toast width so stacked shell feedback stays uniform', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Settings',
        message: 'Landing quality set to Auto.',
        variant: 'TOAST',
        width: 40,
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      state = pushNotification(state, {
        title: 'Settings',
        message: 'Landing quality set to Performance.',
        variant: 'TOAST',
        width: 40,
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 10);
      state = tickNotifications(state, 250);
      const overlays = renderNotificationStack(state, {
        screenWidth: 120,
        screenHeight: 32,
      });
      expect(overlays).toHaveLength(2);
      const first = overlays[0];
      const second = overlays[1];
      if (first == null || second == null) {
        throw new Error('expected two rendered notifications');
      }
      const firstWidth = first.surface?.width;
      const secondWidth = second.surface?.width;
      expect(firstWidth).toBeDefined();
      expect(secondWidth).toBeDefined();
      expect(firstWidth).toBe(secondWidth);
      expect(firstWidth).toBe(43);
    });
});
