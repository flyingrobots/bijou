import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import { wordmark } from '../components/library-wordmark.js';

/* Title cards for the hero reel: a caption band over recorded frames, and the closing card. */

const INK = '#f4ede8';
const PAPER = '#1b1716';

function putCentred(surface: Surface, y: number, text: string, style: { fg: string; bg?: string; modifiers?: string[] }): void {
  const chars = Array.from(text);
  const x = Math.max(0, Math.floor((surface.width - chars.length) / 2));
  chars.forEach((char, i) => {
    if (x + i < surface.width) surface.set(x + i, y, { char, fg: style.fg, bg: style.bg ?? PAPER, modifiers: style.modifiers ?? [], empty: false });
  });
}

/** The frame with a caption band across it, `fromBottom` rows above the last row. */
export function captioned(frame: Surface, caption: string, accent: string, fromBottom = 5): Surface {
  const out = frame.clone();
  const y = Math.max(0, out.height - 1 - fromBottom);
  const text = `  ${caption}  `;
  const width = Array.from(text).length;
  const x0 = Math.max(0, Math.floor((out.width - width) / 2));
  // A one-row margin above and below keeps the caption off whatever the app drew there.
  for (let row = y - 1; row <= y + 1; row++) {
    for (let x = x0 - 1; x < x0 + width + 1; x++) {
      if (x >= 0 && x < out.width && row >= 0) out.set(x, row, { char: ' ', bg: PAPER, empty: false });
    }
  }
  for (let x = x0 - 1; x < x0 + width + 1; x++) {
    if (x >= 0 && x < out.width && y + 1 < out.height) out.set(x, y + 1, { char: '▔', fg: accent, bg: PAPER, empty: false });
  }
  putCentred(out, y, text, { fg: INK, modifiers: ['bold'] });
  return out;
}

/** The closing card: the Bijou wordmark, the repository, and the install command. */
export function endCard(cols: number, rows: number, ctx: BijouContext): Surface {
  const card = createSurface(cols, rows);
  card.fill({ char: ' ', bg: PAPER, empty: false });
  const markRows = 10;
  const mark = wordmark(markRows, ctx);
  const top = Math.max(0, Math.floor((rows - markRows - 6) / 2));
  card.blit(mark, Math.max(0, Math.floor((cols - mark.width) / 2)), top);
  for (let y = top; y < top + markRows; y++) for (let x = 0; x < cols; x++) {
    const cell = card.get(x, y);
    if (cell.bg === undefined) card.set(x, y, { ...cell, bg: PAPER });
  }
  putCentred(card, top + markRows + 2, 'github.com/flyingrobots/bijou', { fg: INK, modifiers: ['bold'] });
  putCentred(card, top + markRows + 4, 'npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui', { fg: ctx.semantic('accent').hex });
  return card;
}
