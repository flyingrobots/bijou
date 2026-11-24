// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type DemoEntry } from '../contract.js';
import { brailleMask } from '../panel.js';
import { layoutLine, roll, tickerLines } from './cylinder-geometry.js';
import { paintGround, paintHud, paintMissing } from './font-hud.js';
import { fill, gridBounds } from './font-outline.js';
import { editMessage, startTyping, type Typing } from './font-typing.js';
import { hslToRgb } from './hsl.js';
import type { Typeface } from './typeface.js';

/** Four words rolling over a cylinder under perspective, each letter staggered, lit by how near the front it is. */
function paintCylinder(surface: Surface, face: Extract<Typeface, { status: 'ready' }>, lines: readonly string[], time: number): void {
  const { width, height } = surface;
  const [gridW, gridH] = [width * 2, height * 4];
  const lit = new Uint8Array(gridW * gridH);
  const hues = new Float32Array(gridW * gridH);
  const shades = new Float32Array(gridW * gridH);
  lines.forEach((text, line) => {
    const { centres } = layoutLine(face, text);
    for (let c = 0; c < text.length; c += 1) {
      const rolling = roll(face, text.charAt(c), centres[c] ?? 0, line, c, time, [gridW, gridH]);
      if (rolling === null) continue;
      fill(rolling.paths, gridBounds(rolling.paths, gridW, gridH), (x, y) => {
        lit[y * gridW + x] = 1;
        hues[y * gridW + x] = rolling.hue;
        shades[y * gridW + x] = rolling.shade;
      });
    }
  });
  for (let cy = 0; cy < height; cy += 1) {
    for (let cx = 0; cx < width; cx += 1) {
      const mask = brailleMask(lit, gridW, cx, cy);
      if (mask === 0) continue;
      const sample = (cy * 4 + 2) * gridW + cx * 2 + 1;
      const [hue, shade] = [hues[sample] ?? 0, shades[sample] ?? 1];
      const fg = hslToRgb(hue, 95, Math.round(55 * shade));
      const bg = hslToRgb(hue + 30, 95, Math.round(10 * shade));
      surface.setRGB(cx, cy, String.fromCharCode(0x2800 + mask), fg.r, fg.g, fg.b, bg.r, bg.g, bg.b);
    }
  }
}

/** The text cylinder. It types in its own `update`, like the font renderer; the message's words become the four lines. */
export function textCylinderDemo(face: Typeface, message: string): DemoEntry {
  return defineDemo<Typing>({
    id: 'text-cylinder',
    name: '3D Text Cylinder Ticker',
    description: 'Letters rolling over a 3D text cylinder',
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
      const lines = tickerLines(state.text);
      paintCylinder(surface, face, lines, elapsed);
      paintHud(surface, ctx, '3D TEXT CYLINDER TICKER', [
        `  Message:     "${state.text}"`,
        `  Lines:       ${lines.join(', ')}`,
        '  Font:        Space Mono Bold Italic',
      ], state);
      return surface;
    },
  });
}
