import { colorHex } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { createKeyMap } from './keybindings.js';

import { createNotificationState, dismissNotification, pushNotification, tickNotifications } from './notification.js';

import type { NotificationState } from './notification.js';

import type { FramePage } from './app-frame.js';

import { makeLongContent, textView } from './app-frame.test-support.part01.js';

import type { Msg, PageModel } from './app-frame.test-support.part01.js';
export function surfaceHasFg(surface: Surface, fg: string): boolean {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      if (colorHex(surface.get(x, y).fg) === fg) return true;
    }
  }
  return false;
}
export function surfaceHasBg(surface: Surface, bg: string): boolean {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      if (colorHex(surface.get(x, y).bg) === bg) return true;
    }
  }
  return false;
}
export function seedNotificationHistory<Msg>(
  specs: readonly {
    readonly title: string;
    readonly message?: string;
    readonly tone?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    readonly variant?: 'TOAST' | 'INLINE' | 'ACTIONABLE';
  }[],
): NotificationState<Msg> {
  let state = createNotificationState<Msg>();
  let nowMs = 0;
  for (const spec of specs) {
    state = pushNotification(state, {
      title: spec.title,
      message: spec.message ?? `${spec.title} message`,
      tone: spec.tone ?? 'INFO',
      variant: spec.variant ?? 'TOAST',
      durationMs: null,
    }, nowMs);
    const latest = state.items.at(-1);
    if (latest === undefined) throw new Error('expected pushed notification');
    const id = latest.id;
    nowMs += 20;
    state = dismissNotification(state, id, nowMs);
    nowMs += 500;
    state = tickNotifications(state, nowMs);
  }
  return state;
}
export function makePage(id: string, title: string, paneId: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ count: 0 }, []],
    update(msg, model) {
      if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId,
      render: () => textView(makeLongContent(`${id}:${paneId}`)),
    }),
    keyMap: createKeyMap<Msg>()
      .bind('x', 'Increment', { type: 'inc' }),
  };
}
export function makeModalPage(id: string, title: string, paneId: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ count: 0, modalOpen: false }, []],
    update(msg, model) {
      if (msg.type === 'toggle-modal') return [{ ...model, modalOpen: !model.modalOpen }, []];
      if (msg.type === 'close-modal') return [{ ...model, modalOpen: false }, []];
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId,
      render: () => textView(makeLongContent(`${id}:${paneId}`)),
    }),
    keyMap: createKeyMap<Msg>()
      .bind('m', 'Toggle modal', { type: 'toggle-modal' })
      .bind('x', 'Increment', { type: 'inc' }),
    modalKeyMap: (model) => model.modalOpen
      ? createKeyMap<Msg>().bind('escape', 'Close modal', { type: 'close-modal' })
      : undefined,
  };
}
