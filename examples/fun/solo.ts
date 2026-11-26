// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { isKeyMsg, isMouseMsg, isPulseMsg, isResizeMsg, type App } from '@flyingrobots/bijou-tui';
import type { DemoEntry, DemoMsg, Session } from './contract.js';
import { footerRow, paintPane, typed } from './shell-chrome.js';

const FOOTER_ROWS = 1;

export interface SoloModel {
  readonly session: Session;
  readonly columns: number;
  readonly rows: number;
}

export interface SoloOptions {
  readonly ctx: BijouContext;
  readonly entry: DemoEntry;
  readonly seed: number;
}

/** The cells the demo's pane has: the screen less the footer row. */
function paneOf(columns: number, rows: number): DemoMsg {
  return { type: 'resize', width: columns, height: Math.max(1, rows - FOOTER_ROWS) };
}

/**
 * One demo alone, for a page that shows nothing else: its pane fills the screen above one row that names the demo and
 * its keys. There is no list of demos and no key of the host's own, so tab, the arrows, the digits and `q` all reach the
 * demo; the page it is on is how a person leaves. `ctrl+c` does nothing. Pointer movement inside the pane reaches the
 * demo in the pane's own cells; on the footer row it is a pointer-leave. A demo that throws in `view` is painted as a
 * failure in the pane.
 */
export function createSoloApp({ ctx, entry, seed }: SoloOptions): App<SoloModel> {
  const send = (model: SoloModel, msg: DemoMsg): [SoloModel, []] => [{ ...model, session: model.session.update(msg) }, []];
  return {
    init: () => {
      const { columns, rows } = ctx.runtime;
      return [{ session: entry.mount(seed).update(paneOf(columns, rows)), columns, rows }, []];
    },
    update(msg, model) {
      if (isResizeMsg(msg)) {
        return [{ session: model.session.update(paneOf(msg.columns, msg.rows)), columns: msg.columns, rows: msg.rows }, []];
      }
      if (isPulseMsg(msg)) return send(model, { type: 'pulse', dt: msg.dt });
      if (isMouseMsg(msg)) {
        if (msg.action !== 'move' && msg.action !== 'press') return [model, []];
        const inside = msg.col >= 0 && msg.col < model.columns && msg.row >= 0 && msg.row < model.rows - FOOTER_ROWS;
        return send(model, inside ? { type: 'pointer', col: msg.col, row: msg.row } : { type: 'pointer-leave' });
      }
      if (!isKeyMsg(msg) || (msg.ctrl && msg.key === 'c')) return [model, []];
      return send(model, { type: 'key', key: model.session.capturing ? typed(msg) : msg.key });
    },
    view(model): Surface {
      const { columns, rows, session } = model;
      const screen = createSurface(columns, rows);
      screen.blit(paintPane(ctx, entry, session, columns, Math.max(1, rows - FOOTER_ROWS)), 0, 0);
      screen.blit(footerRow(ctx, entry, session.paused, columns), 0, rows - 1);
      return screen;
    },
  };
}
