// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { boxSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';

export interface LandingCard {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/** Where the grid sits and how it is cut into cards. */
export interface CardGrid {
  readonly top: number;
  readonly left: number;
  readonly columns: number;
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly gap: number;
  /** Rows of cards that fit on screen at once. */
  readonly visibleRows: number;
}

const CARD_HEIGHT = 4;
const GAP = 2;
const MIN_CARD = 24;

export function cardGrid(width: number, height: number, top: number): CardGrid {
  const columns = Math.max(1, Math.min(4, Math.floor((width - 2 + GAP) / (MIN_CARD + GAP))));
  const cardWidth = Math.min(40, Math.floor((width - 2 - (columns - 1) * GAP) / columns));
  const used = columns * cardWidth + (columns - 1) * GAP;
  const visibleRows = Math.max(1, Math.floor((height - top - 1) / (CARD_HEIGHT + 1)));
  return { top, left: Math.max(0, Math.floor((width - used) / 2)), columns, cardWidth, cardHeight: CARD_HEIGHT, gap: GAP, visibleRows };
}

/** The first row of cards on screen, so the selected card is always visible. */
export function firstRow(grid: CardGrid, selected: number, count: number): number {
  const rows = Math.ceil(count / grid.columns);
  const row = Math.floor(selected / grid.columns);
  return Math.max(0, Math.min(rows - grid.visibleRows, row - grid.visibleRows + 1));
}

/** The card under a cell, or null. */
export function cardAt(grid: CardGrid, start: number, count: number, col: number, row: number): number | null {
  const x = col - grid.left;
  const y = row - grid.top;
  if (x < 0 || y < 0) return null;
  const c = Math.floor(x / (grid.cardWidth + grid.gap));
  const r = Math.floor(y / (grid.cardHeight + 1));
  if (c >= grid.columns || x - c * (grid.cardWidth + grid.gap) >= grid.cardWidth) return null;
  if (r >= grid.visibleRows || y - r * (grid.cardHeight + 1) >= grid.cardHeight) return null;
  const index = (start + r) * grid.columns + c;
  return index < count ? index : null;
}

function clip(text: string, width: number): string {
  return text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`;
}

/** Two lines of description, cut at a word where it can be. */
function lines(text: string, width: number): readonly [string, string] {
  if (text.length <= width) return [text, ''];
  const cut = text.lastIndexOf(' ', width);
  const at = cut > width / 2 ? cut : width;
  return [text.slice(0, at), clip(text.slice(at).trim(), width)];
}

/** Paint the visible cards as boxes: the selected one has a bright border and its name marked. */
export function paintCards(screen: Surface, grid: CardGrid, cards: readonly LandingCard[], selected: number, ctx: BijouContext): void {
  const start = firstRow(grid, selected, cards.length);
  const inner = grid.cardWidth - 4;
  for (let r = 0; r < grid.visibleRows; r += 1) {
    for (let c = 0; c < grid.columns; c += 1) {
      const index = (start + r) * grid.columns + c;
      const card = cards[index];
      if (card === undefined) continue;
      const chosen = index === selected;
      const [first, second] = lines(card.description, inner);
      const box = boxSurface([first, second].join('\n'), {
        ctx,
        title: clip(`${chosen ? '▶ ' : ''}${card.name}`, inner),
        width: grid.cardWidth,
        borderToken: { hex: chosen ? '#ffd76e' : '#5a6378' },
        bgToken: { hex: chosen ? '#1d1a2e' : '#0d0f18' },
      });
      screen.blit(box, grid.left + c * (grid.cardWidth + grid.gap), grid.top + r * (grid.cardHeight + 1));
    }
  }
}
