// Copyright 2026 James Ross. SPDX-License-Identifier: Apache-2.0
import type { BijouContext } from '@flyingrobots/bijou';
import { isKeyMsg, quit, type App, type Cmd, type KeyMsg } from '@flyingrobots/bijou-tui';
import { EffectDriver } from './effects.js';
import { Monitor } from './monitor.js';
import type { MonitorEvent } from './protocol.js';
import { view } from './presentation.js';
export interface AppModel { readonly monitor: Monitor; readonly width: number; readonly height: number; readonly offset: number }
export function keyIntent(key: KeyMsg): MonitorEvent | undefined {
  if (key.key === 'up') return { type: 'move', delta: -1 };
  if (key.key === 'down') return { type: 'move', delta: 1 };
  if (key.key === 'enter' || key.key === 'return') return { type: 'start' };
  if (key.key === 'c') return { type: 'ask-cancel' };
  if (key.key === 'escape') return { type: 'dismiss' };
  if (key.key === 'f') return { type: 'filter' };
  if (key.key === 'l') return { type: 'logs' };
  return undefined;
}
export interface ShutdownPort { subscribe(stop: () => void): () => void }
export type AppEvent = MonitorEvent | { readonly type: 'shutdown' };
export function createMonitorApp(ctx: BijouContext, driver: EffectDriver, shutdown?: ShutdownPort): App<AppModel, AppEvent> {
  return {
    init: () => [{ monitor: Monitor.initial(), width: ctx.runtime.columns, height: ctx.runtime.rows, offset: 0 }, shutdown ? [emit => shutdown.subscribe(() => emit({ type: 'shutdown' }))] : []],
    update: (message, model) => {
      if (message.type === 'shutdown') { driver.dispose(); return [model, [quit()]]; }
      if (isKeyMsg(message)) {
        if (message.key === 'q' || (message.ctrl && message.key === 'c')) { driver.dispose(); return [model, [quit()]]; }
        if (!model.monitor.confirming && (message.key === 'j' || message.key === 'k')) return [{ ...model, offset: message.key === 'j' ? model.offset + 1 : Math.max(0, model.offset - 1) }, []];
        const intent = model.monitor.confirming && (message.key === 'enter' || message.key === 'return') ? { type: 'confirm-cancel' as const } : keyIntent(message);
        if (!intent) return [model, []];
        const transition = model.monitor.update(intent);
        const commands: Cmd<AppEvent>[] = transition.effects.map(effect => emit => { driver.execute(effect, emit); return undefined; });
        return [{ ...model, monitor: transition.model, offset: 0 }, commands];
      }
      if (message.type === 'resize') return [{ ...model, width: Math.max(1, message.columns), height: Math.max(1, message.rows), offset: 0 }, []];
      if (message.type === 'mouse' || message.type === 'pulse') return [model, []];
      const transition = model.monitor.update(message);
      return [{ ...model, monitor: transition.model }, transition.effects.map(effect => emit => { driver.execute(effect, emit); return undefined; })];
    },
    view: model => view(model.monitor, ctx, model.width, model.height, model.offset),
  };
}
