// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { boxSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import type { Typing } from './font-typing.js';
import type { Typeface } from './typeface.js';

/** The dotted dark ground both demos draw on. */
export function paintGround(surface: Surface): void {
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      if (x % 4 === 0 && y % 2 === 0) surface.setRGB(x, y, '.', 20, 25, 35, 5, 8, 12);
      else surface.setRGB(x, y, ' ', 0, 0, 0, 4, 6, 8);
    }
  }
}

/** The card a demo paints in place of its picture when the font did not arrive: what is wrong, and why. */
export function paintMissing(surface: Surface, face: Typeface, ctx: BijouContext): void {
  const lines = ['Error: TTF Font file missing or failed to parse.', ...(face.status === 'missing' ? [face.reason] : [])];
  const card = boxSurface(lines.join('\n'), { width: Math.max(...lines.map((line) => line.length)) + 4, ctx });
  surface.blit(card, Math.max(0, Math.floor((surface.width - card.width) / 2)), Math.max(0, Math.floor((surface.height - card.height) / 2)));
}

/** The card draws narrow text only, so a character beyond printable ASCII shows as `?`, whatever the font makes of it. */
function printable(line: string): string {
  return line.replace(/[^\x20-\x7e]/gu, '?');
}

/** The HUD card: a title, what the demo shows, then the mode and the keys of the current mode. */
export function paintHud(surface: Surface, ctx: BijouContext, title: string, info: readonly string[], state: Typing): void {
  const typing = state.typing;
  const lines = [
    `  ***  ${title}  ***  `,
    '──────────────────────────────────────',
    ...info.map(printable),
    '──────────────────────────────────────',
    typing ? '  MODE: [INSERT] - Esc to finish' : '  MODE: [NORMAL] - I to type',
    typing ? '  - Type characters to edit message' : '  - [i] or [Enter] : Enter typing mode',
    typing ? '  - [Backspace]    : Delete character' : '  - [R]            : Clear message',
    typing ? '  - [Space]        : Type space' : '  - [Space]        : Pause animation',
    typing ? '  - [Escape]       : Finish typing' : '  - [H]            : Hide this card',
  ];
  const width = Math.max(38, ...lines.map((line) => line.length)) + 2;
  const height = lines.length + 2;
  if (!state.hud || surface.width < width || surface.height < height) return;
  surface.blit(boxSurface(lines.join('\n'), { width, ctx }), Math.max(0, Math.min(4, surface.width - width - 2)), Math.max(0, surface.height - height - 1));
}
