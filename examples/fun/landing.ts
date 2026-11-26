// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The landing page of the published site, as a Bijou app: one fun demo, chosen
// by the page, runs behind the Bijou wordmark in Jacquard 12, and a grid of
// cards opens each demo.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { isKeyMsg, isMouseMsg, isPulseMsg, isResizeMsg, rasterTextSurface, type App, type Cmd } from '@flyingrobots/bijou-tui';
import { CYLINDER_FONT } from '../docs/app-cylinder-font.js';
import type { DemoEntry, Session } from './contract.js';
import { cardAt, cardGrid, firstRow, paintCards, type LandingCard } from './landing-cards.js';

export interface LandingModel {
  /** The background demo. It hears pulses and the pane size, never the pointer or the keys. */
  readonly background: Session;
  readonly columns: number;
  readonly rows: number;
  readonly selected: number;
}

export interface LandingOptions {
  readonly ctx: BijouContext;
  readonly cards: readonly LandingCard[];
  /** The demo that runs behind the page; the page picks it. */
  readonly background: DemoEntry;
  /** Open the demo with this id: the page decides how (a browser navigates to its address). */
  readonly open: (id: string) => void;
  readonly seed: number;
}

const WORDMARK_FG: readonly [number, number, number] = [255, 215, 110];
/** Rows above the wordmark. */
const WORDMARK_TOP = 2;

function wordmarkRows(rows: number): number {
  return Math.max(4, Math.min(16, Math.floor(rows * 0.35)));
}

/** Lay the wordmark over the background: only cells the glyphs cover change. */
function paintWordmark(screen: Surface, rows: number): void {
  const mark = rasterTextSurface('Bijou', CYLINDER_FONT, { columns: screen.width, rows, renderer: { kind: 'braille' } });
  for (let y = 0; y < mark.height && y + WORDMARK_TOP < screen.height; y += 1) {
    for (let x = 0; x < mark.width; x += 1) {
      const { char } = mark.get(x, y);
      if (char === ' ' || char === '⠀') continue;
      screen.setRGB(x, y + WORDMARK_TOP, char, WORDMARK_FG[0], WORDMARK_FG[1], WORDMARK_FG[2], 0, 0, 0);
    }
  }
}

export function createLandingApp({ ctx, cards, background, open, seed }: LandingOptions): App<LandingModel> {
  const top = (rows: number): number => WORDMARK_TOP + wordmarkRows(rows) + 1;
  // `h` hides a demo's own card or panel, so the page shows the picture alone.
  const mounted = (columns: number, rows: number): Session =>
    background.mount(seed).update({ type: 'resize', width: columns, height: rows }).update({ type: 'key', key: 'h' });
  const opening = (index: number): Cmd<never>[] => {
    const card = cards[index];
    return card === undefined ? [] : [() => { open(card.id); return undefined; }];
  };
  const move = (model: LandingModel, by: number): [LandingModel, []] =>
    [{ ...model, selected: Math.max(0, Math.min(cards.length - 1, model.selected + by)) }, []];
  return {
    init: () => {
      const { columns, rows } = ctx.runtime;
      return [{ background: mounted(columns, rows), columns, rows, selected: 0 }, []];
    },
    update(msg, model) {
      if (isPulseMsg(msg)) return [{ ...model, background: model.background.update({ type: 'pulse', dt: msg.dt }) }, []];
      if (isResizeMsg(msg)) {
        const resized = model.background.update({ type: 'resize', width: msg.columns, height: msg.rows });
        return [{ ...model, columns: msg.columns, rows: msg.rows, background: resized }, []];
      }
      if (isMouseMsg(msg)) {
        const grid = cardGrid(model.columns, model.rows, top(model.rows));
        const hit = cardAt(grid, firstRow(grid, model.selected, cards.length), cards.length, msg.col, msg.row);
        if (hit !== null && msg.action === 'press') return [{ ...model, selected: hit }, opening(hit)];
        return [{ ...model, selected: hit ?? model.selected }, []];
      }
      if (!isKeyMsg(msg)) return [model, []];
      const across = cardGrid(model.columns, model.rows, top(model.rows)).columns;
      if (msg.key === 'right' || msg.key === 'l') return move(model, 1);
      if (msg.key === 'left' || msg.key === 'h') return move(model, -1);
      if (msg.key === 'down' || msg.key === 'j') return move(model, across);
      if (msg.key === 'up' || msg.key === 'k') return move(model, -across);
      if (msg.key === 'enter' || msg.key === 'space') return [model, opening(model.selected)];
      return [model, []];
    },
    view(model): Surface {
      const { columns, rows } = model;
      const screen = createSurface(columns, rows);
      screen.blit(model.background.view(columns, rows, ctx), 0, 0);
      paintWordmark(screen, wordmarkRows(rows));
      paintCards(screen, cardGrid(columns, rows, top(rows)), cards, model.selected, ctx);
      const hint = ' ←↑↓→ choose · Enter or click opens · github.com/flyingrobots/bijou ';
      const x = Math.max(0, Math.floor((columns - hint.length) / 2));
      for (let i = 0; i < hint.length && x + i < columns; i += 1) screen.setRGB(x + i, rows - 1, hint[i] ?? ' ', 150, 160, 180, 0, 0, 0);
      return screen;
    },
  };
}
