import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stripAnsi } from './viewport.js';
import {
  activateFocusedNotification,
  createNotificationState,
  cycleNotificationFocus,
  dismissNotification,
  relocateNotifications,
  notificationsNeedTick,
  pushNotification,
  renderNotificationStack,
  trimNotificationsToViewport,
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

    state = tickNotifications(state, 4_600);
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
        title: `Notice ${index + 1}`,
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
    });

    expect(state.items.length).toBeLessThan(5);
    expect(state.items.some((item) => item.title === 'Notice 5')).toBe(true);
    expect(state.history.some((item) => item.title === 'Notice 1')).toBe(true);
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

    expect(after!.row).toBeLessThan(before!.row);
    expect(after!.col).toBeLessThan(before!.col);
    expect(moved.items[0]?.phase).toBe('entering');
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

    state = dismissNotification(state, state.items[0]!.id, 300);
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
    expect(animating!.col).toBeGreaterThanOrEqual(visible!.col);

    state = tickNotifications(state, 650);
    const overlays = renderNotificationStack(state, {
      screenWidth: 90,
      screenHeight: 30,
    });
    expect(overlays).toHaveLength(0);
  });

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
    const surface = overlay!.surface!;
    const expectedBg = surface.get(1, 0).bg;

    expect(expectedBg).toBeDefined();
    for (let y = 0; y < surface.height; y++) {
      expect(surface.get(1, y).bg).toBe(expectedBg);
      expect(surface.get(surface.width - 1, y).bg).toBe(expectedBg);
      expect(surface.get(Math.max(2, surface.width - 2), y).bg).toBe(expectedBg);
    }
  });
});
