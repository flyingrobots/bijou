import { describe, expect, it } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { stripAnsi } from './viewport.js';
import { createNotificationState, hitTestNotificationStack, pushNotification, renderNotificationStack, tickNotifications } from './notification.js';

type Msg =
  | { type: 'retry'; id: number }
  | { type: 'ignore' };

describe('renderNotificationStack', () => {
  it('hit-tests dismiss and action targets inside the rendered stack', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Deploy failed',
        message: 'The worker crashed before boot.',
        variant: 'ACTIONABLE',
        action: { label: 'Retry deploy', payload: { type: 'retry', id: 7 } },
        placement: 'LOWER_RIGHT',
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      });
      const overlayBounds = must(overlay);
      const overlaySurface = must(overlayBounds.surface);
      const dismiss = hitTestNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      }, overlayBounds.col + overlaySurface.width - 2, overlayBounds.row);
      expect(dismiss?.kind).toBe('dismiss');
      const action = hitTestNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      }, overlayBounds.col + 3, overlayBounds.row + overlaySurface.height - 1);
      expect(action?.kind).toBe('action');
      expect(action?.item.title).toBe('Deploy failed');
    });

  it('renders toast timestamps and inline notifications in their distinct layouts', () => {
      let toastState = createNotificationState<Msg>();
      toastState = pushNotification(toastState, {
        title: 'Saved',
        message: 'Config synced',
        variant: 'TOAST',
      }, 0);
      toastState = tickNotifications(toastState, 250);
      const [toastOverlay] = renderNotificationStack(toastState, {
        screenWidth: 80,
        screenHeight: 24,
      });
      expect(stripAnsi(toastOverlay?.content)).toMatch(/\d{2}:\d{2}:\d{2} [AP]M/);
      let inlineState = createNotificationState<Msg>();
      inlineState = pushNotification(inlineState, {
        title: 'Inline notice',
        message: 'Rendered as one row',
        variant: 'INLINE',
        placement: 'TOP_CENTER',
      }, 0);
      inlineState = tickNotifications(inlineState, 250);
      const [inlineOverlay] = renderNotificationStack(inlineState, {
        screenWidth: 100,
        screenHeight: 28,
      });
      const lines = stripAnsi(inlineOverlay?.content).split('\n');
      expect(lines).toHaveLength(1);
      expect(must(lines[0])).toContain('Inline notice');
      expect(must(lines[0])).toContain('Rendered as one row');
    });

  it('wraps long notification copy by default instead of truncating it', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Deploy pipeline for western region exceeded retry budget',
        message: 'This toast should wrap instead of clipping away the trailing diagnostic text.',
        variant: 'TOAST',
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 48,
        screenHeight: 20,
      });
      const lines = stripAnsi(overlay?.content).split('\n');
      expect(lines.length).toBeGreaterThan(3);
      expect(lines.join('\n')).toContain('diagnostic');
      expect(lines.join('\n')).toContain('text.');
    });

  it('wraps live notification body copy at word boundaries', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Runtime error',
        message: 'command: Undo must be submitted as explicit causal input before production use.',
        variant: 'TOAST',
        width: 52,
        durationMs: null,
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 80,
        screenHeight: 24,
      });
      const lines = stripAnsi(overlay?.content).split('\n')
        .map((line) => line.replace(/^\s*\S?\s*/, '').trimEnd());
      expect(lines).toContain('command: Undo must be submitted as explicit causal');
      expect(lines).toContain('input before production use.');
      expect(lines.join('\n')).not.toContain('causal i\nnput');
    });

  it('supports per-notification truncate overflow overrides', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Deploy pipeline for western region exceeded retry budget',
        message: 'This toast should clip when truncate overflow is requested.',
        variant: 'TOAST',
        overflow: 'truncate',
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 48,
        screenHeight: 20,
      });
      const lines = stripAnsi(overlay?.content).split('\n');
      expect(lines.join('\n')).not.toContain('requested.');
    });

  it('anchors stacks inside an explicit render region', () => {
      let state = createNotificationState<Msg>();
      state = pushNotification(state, {
        title: 'Scoped',
        message: 'Pane-only overlay',
        variant: 'TOAST',
        placement: 'TOP_CENTER',
      }, 0);
      state = tickNotifications(state, 250);
      const [overlay] = renderNotificationStack(state, {
        screenWidth: 120,
        screenHeight: 40,
        region: { col: 12, row: 6, width: 48, height: 16 },
      });
      expect(overlay).toBeDefined();
      expect(overlay?.row).toBeGreaterThanOrEqual(6);
      expect(overlay?.col).toBeGreaterThanOrEqual(12);
      expect(overlay?.col).toBeLessThan(60);
    });
});
