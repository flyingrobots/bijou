// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type DemoEntry } from '../contract.js';
import { brailleMask } from '../panel.js';
import { boundsOf, fill, gridBounds } from './font-outline.js';
import { paintGround, paintHud, paintMissing } from './font-hud.js';
import { editMessage, startTyping, type Typing } from './font-typing.js';
import { hslToRgb } from './hsl.js';
import type { Typeface } from './typeface.js';

const BASE_SIZE = 100;

/** The message as vector outlines fitted to the pane, filled at braille resolution in a travelling rainbow. */
function paintText(surface: Surface, face: Extract<Typeface, { status: 'ready' }>, text: string, time: number): void {
  const { width, height } = surface;
  const [gridW, gridH] = [width * 2, height * 4];
  const outline = face.text(text, BASE_SIZE);
  const box = boundsOf(outline);
  if (box === null || box.maxX - box.minX <= 0 || box.maxY - box.minY <= 0) return;
  const scale = Math.min((gridW * 0.92) / (box.maxX - box.minX), (gridH * 0.7) / (box.maxY - box.minY));
  const dx = gridW / 2 - ((box.minX + box.maxX) / 2) * scale;
  // Classic demo sinus bobbing.
  const dy = gridH / 2 + Math.sin(time * 2.8) * (gridH * 0.08) - ((box.minY + box.maxY) / 2) * scale;
  const fitted = outline.map((path) => path.map((v) => ({ x: v.x * scale + dx, y: v.y * scale + dy })));
  const grid = new Uint8Array(gridW * gridH);
  fill(fitted, gridBounds(fitted, gridW, gridH), (x, y) => { grid[y * gridW + x] = 1; });
  for (let cy = 0; cy < height; cy += 1) {
    for (let cx = 0; cx < width; cx += 1) {
      const mask = brailleMask(grid, gridW, cx, cy);
      if (mask === 0) continue;
      const hue = (cx * 4.5 + cy * 8 - time * 95) % 360;
      const fg = hslToRgb(hue, 95, 65);
      const bg = hslToRgb(hue + 30, 95, 12);
      surface.setRGB(cx, cy, String.fromCharCode(0x2800 + mask), fg.r, fg.g, fg.b, bg.r, bg.g, bg.b);
    }
  }
}

/** The outline font renderer. It types in its own `update`: `i` starts, escape finishes, `r` clears, `h` hides the card. */
export function fontRendererDemo(face: Typeface, message: string): DemoEntry {
  return defineDemo<Typing>({
    id: 'font-renderer',
    name: 'TTF Font Vector Renderer',
    description: 'Typed text as outlines in animated braille',
    keys: 'i type, r clear, h hud',
    captures: (state) => state.typing,
    init: () => startTyping(message),
    update: editMessage,
    view(state, { width, height, elapsed, ctx }) {
      const surface = createSurface(width, height);
      paintGround(surface);
      if (face.status === 'missing') {
        paintMissing(surface, face, ctx);
        return surface;
      }
      paintText(surface, face, state.text, elapsed);
      paintHud(surface, ctx, 'TTF VECTOR FONT RENDERER', [
        `  Message:     "${state.text}"`,
        `  Length:      ${String(state.text.length)} / 24 chars`,
        '  Font:        Space Mono Bold Italic',
      ], state);
      return surface;
    },
  });
}
