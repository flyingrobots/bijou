import { describe, expect, it } from 'vitest';
import { stripAnsi } from './viewport.js';
import {
  activateFocusedNotification,
  createNotificationState,
  cycleNotificationFocus,
  notificationsNeedTick,
  pushNotification,
  renderNotificationStack,
  tickNotifications,
} from './notification.js';

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

    state = tickNotifications(state, 4_500);
    expect(state.items).toHaveLength(0);
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
});

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
    expect(older).toBeDefined();
    expect(newer).toBeDefined();
    expect(newer!.row).toBeGreaterThan(older!.row);
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

    expect(stripAnsi(overlay!.content)).toContain('[ Retry deploy ]');
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
    expect(stripAnsi(toastOverlay!.content)).toMatch(/\d{2}:\d{2}:\d{2} [AP]M/);

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
    const lines = stripAnsi(inlineOverlay!.content).split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]!).toContain('Inline notice');
    expect(lines[0]!).toContain('Rendered as one row');
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
    const lines = stripAnsi(overlay!.content).split('\n');

    expect(lines.length).toBeGreaterThan(3);
    expect(lines.join('\n')).toContain('diagnostic text.');
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
    const lines = stripAnsi(overlay!.content).split('\n');

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
    expect(overlay!.row).toBeGreaterThanOrEqual(6);
    expect(overlay!.col).toBeGreaterThanOrEqual(12);
    expect(overlay!.col).toBeLessThan(60);
  });
});
