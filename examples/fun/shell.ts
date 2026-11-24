// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { isKeyMsg, isMouseMsg, isPulseMsg, isResizeMsg, quit, type App, type KeyMsg } from '@flyingrobots/bijou-tui';
import type { DemoEntry, DemoMsg, Session } from './contract.js';
import { failurePane, footerRow, headerRow } from './shell-chrome.js';

const CHROME_ROWS = 2;

export interface ShellModel {
  readonly index: number;
  readonly sessions: readonly Session[];
  readonly columns: number;
  readonly rows: number;
}

export interface ShellOptions {
  readonly ctx: BijouContext;
  readonly entries: readonly DemoEntry[];
  readonly seed: number;
}

/** The cells the demo's pane has: the screen less the header and footer rows. */
function paneOf(columns: number, rows: number): DemoMsg {
  return { type: 'resize', width: columns, height: Math.max(1, rows - CHROME_ROWS) };
}

function withActive(model: ShellModel, change: (session: Session) => Session): ShellModel {
  return { ...model, sessions: model.sessions.map((session, i) => (i === model.index ? change(session) : session)) };
}

function goTo(model: ShellModel, index: number): ShellModel {
  const count = model.sessions.length;
  return { ...model, index: ((index % count) + count) % count };
}

/** The key a demo hears while it takes text: a shifted letter keeps its shift, so `B` is not `b`. */
function typed(msg: KeyMsg): string {
  return msg.shift && /^[a-z]$/u.test(msg.key) ? `shift+${msg.key}` : msg.key;
}

function digit(key: string, count: number): number | undefined {
  const n = Number(key);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : undefined;
}

/** The demo's frame, or the failure that stopped it: one demo that throws does not take the shell down. */
function paintPane(ctx: BijouContext, entry: DemoEntry, session: Session, width: number, height: number): Surface {
  try {
    return session.view(width, height, ctx);
  } catch (error) {
    return failurePane(ctx, entry, error, width, height);
  }
}

/**
 * A shell that lists the demos in a header row, paints the active one between the header and a footer row, and
 * routes input: tab and the arrows switch, a digit jumps, q quits, everything else goes to the demo.
 * A demo that is taking text gets every key but ctrl+c. Pointer movement inside the demo's pane reaches it in the
 * pane's own cells; outside the pane it is a pointer-leave.
 */
export function createFunApp({ ctx, entries, seed }: ShellOptions): App<ShellModel> {
  return {
    init: () => [{
      index: 0,
      sessions: entries.map((entry) => entry.mount(seed).update(paneOf(ctx.runtime.columns, ctx.runtime.rows))),
      columns: ctx.runtime.columns,
      rows: ctx.runtime.rows,
    }, []],
    update(msg, model) {
      if (isResizeMsg(msg)) {
        const size = paneOf(msg.columns, msg.rows);
        return [{ ...model, columns: msg.columns, rows: msg.rows, sessions: model.sessions.map((s) => s.update(size)) }, []];
      }
      if (isPulseMsg(msg)) return [withActive(model, (s) => s.update({ type: 'pulse', dt: msg.dt })), []];
      if (isMouseMsg(msg)) {
        if (msg.action !== 'move' && msg.action !== 'press') return [model, []];
        const row = msg.row - 1;
        const inside = msg.col >= 0 && msg.col < model.columns && row >= 0 && row < model.rows - CHROME_ROWS;
        return [withActive(model, (s) => s.update(inside ? { type: 'pointer', col: msg.col, row } : { type: 'pointer-leave' })), []];
      }
      if (!isKeyMsg(msg)) return [model, []];
      if (msg.ctrl && msg.key === 'c') return [model, [quit()]];
      if (model.sessions[model.index]?.capturing === true) return [withActive(model, (s) => s.update({ type: 'key', key: typed(msg) })), []];
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === 'tab' || msg.key === 'right') return [goTo(model, model.index + (msg.shift ? -1 : 1)), []];
      if (msg.key === 'left') return [goTo(model, model.index - 1), []];
      const picked = digit(msg.key, model.sessions.length);
      if (picked !== undefined) return [goTo(model, picked), []];
      return [withActive(model, (s) => s.update({ type: 'key', key: msg.key })), []];
    },
    view(model): Surface {
      const { columns, rows } = model;
      const entry = entries[model.index];
      const session = model.sessions[model.index];
      const screen = createSurface(columns, rows);
      if (entry === undefined || session === undefined) return screen;
      screen.blit(headerRow(ctx, entries, model.index, columns), 0, 0);
      screen.blit(paintPane(ctx, entry, session, columns, Math.max(1, rows - CHROME_ROWS)), 0, 1);
      screen.blit(footerRow(ctx, entry, session.paused, columns), 0, rows - 1);
      return screen;
    },
  };
}
