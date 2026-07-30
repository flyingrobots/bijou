import type { BijouContext } from '@flyingrobots/bijou';
import { box, kbd } from '@flyingrobots/bijou';
import { createKeyMap } from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
} from './notification-demo-contract.js';
import { PLACEMENTS, ctx } from './notification-demo-options.js';
import {
  at,
  currentDuration,
  currentHistoryFilter,
  currentPlacement,
  currentTone,
  currentVariant,
  numberText,
} from './notification-demo-state.js';

export const pageKeyMap = createKeyMap<NotificationDemoMsg>()
  .bind('n', 'Spawn notification', { type: 'spawn-notification' })
  .bind('v', 'Cycle variant', { type: 'cycle-variant' })
  .bind('t', 'Cycle tone', { type: 'cycle-tone' })
  .bind('l', 'Cycle placement', { type: 'cycle-placement' })
  .bind('d', 'Cycle duration', { type: 'cycle-duration' })
  .bind('a', 'Toggle action button', { type: 'toggle-action' })
  .bind('w', 'Toggle text wrap', { type: 'toggle-wrap' })
  .bind('j', 'Focus next actionable notification', { type: 'focus-next' })
  .bind('k', 'Focus previous actionable notification', {
    type: 'focus-prev',
  })
  .bind('enter', 'Run focused notification action', {
    type: 'activate-focused',
  })
  .bind('x', 'Dismiss focused/latest notification', {
    type: 'dismiss-notification',
  });

export function renderControlsPane(
  model: NotificationDemoModel,
  width: number,
  notificationCtx: BijouContext = ctx,
): string {
  const focused =
    model.notifications.focusedId == null
      ? 'none'
      : `#${numberText(model.notifications.focusedId)}`;
  const lines = [
    'Notification Lab',
    '',
    `Variant : ${currentVariant(model)}`,
    `Tone    : ${currentTone(model)}`,
    `Next at : ${currentPlacement(model)}`,
    `Cycle   : ${at(PLACEMENTS, (model.placementIndex + 1) % PLACEMENTS.length)}`,
    `Stay    : ${currentDuration(model).label}`,
    `Action  : ${model.actionEnabled ? 'enabled' : 'disabled'}`,
    `Wrap    : ${model.wrapText ? 'enabled' : 'disabled'}`,
    `Stack   : ${numberText(model.notifications.items.length)}`,
    `History : ${numberText(model.notifications.history.length)}`,
    `Review  : shift+n (${currentHistoryFilter(model)})`,
    `Focus   : ${focused}`,
    `Last key: ${model.lastHandledInput}`,
    '',
    `${kbd('n')} spawn`,
    `${kbd('v')} cycle variant`,
    `${kbd('t')} cycle tone`,
    `${kbd('l')} cycle placement`,
    `${kbd('d')} cycle duration`,
    `${kbd('a')} toggle action`,
    `${kbd('w')} toggle wrap`,
    `${kbd('shift+n')} shell notification center`,
    `${kbd('j')} / ${kbd('k')} focus action`,
    `${kbd('enter')} run action`,
    `${kbd('x')} dismiss focused/latest`,
    `${kbd('/')} search • ${kbd('f2')} settings`,
    '',
    'Try stacking a few in the same corner, then',
    'flip placements to compare the anchor behavior.',
  ];
  return box(lines.join('\n'), {
    width,
    title: 'Controls',
    overflow: model.wrapText ? 'wrap' : 'truncate',
    ctx: notificationCtx,
  });
}

export function renderLogPane(
  model: NotificationDemoModel,
  width: number,
  notificationCtx: BijouContext = ctx,
): string {
  return box(['Recent events', '', ...model.log].join('\n'), {
    width,
    title: 'Activity',
    overflow: model.wrapText ? 'wrap' : 'truncate',
    ctx: notificationCtx,
  });
}
