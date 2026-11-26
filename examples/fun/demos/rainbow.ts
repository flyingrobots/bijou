// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';

const TAU_THIRD = (2 * Math.PI) / 3;

function channel(angle: number): number {
  return Math.round(Math.min(255, Math.max(0, (Math.cos(angle) + 1) * 127.5)));
}

/** The rainbow gradient holds no state: a frame is a function of the pane and the clock. */
const rainbow: Demo<undefined> = {
  id: 'rainbow-gradient',
  name: 'Rainbow Gradient',
  description: 'Full-screen animated colour gradient from cosine waves',
  keys: 'space pause',
  init: () => undefined,
  update: (_msg, state) => state,
  view(_state, { width, height, frame, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const f = frame * 0.04;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const phase = (x + y * 0.6) * 0.06;
        surface.setRGB(
          x, y, 0x2588,
          channel(phase * 0.8 + 1.8 * f), channel(phase * 0.9 + 2 * f + TAU_THIRD), channel(phase * 0.1 + 2.2 * f + 2 * TAU_THIRD),
          channel(phase + f), channel(phase + 1.5 * f + TAU_THIRD), channel(phase + 2 * f + 2 * TAU_THIRD),
        );
      }
    }
    stampPanel(surface, [
      '  ***  BIJOU ART CHALLENGE #01  ***  ',
      '─'.repeat(36),
      '  Name:        Rainbow Gradient',
      `  Viewport:    ${String(width)}x${String(height)}`,
      `  Frame:       ${String(frame)}`,
      `  Elapsed:     ${elapsed.toFixed(2)}s`,
    ], ctx, (free) => ({ x: Math.floor(free.x / 2), y: Math.floor(free.y / 2) }));
    return surface;
  },
};

export const rainbowGradient = defineDemo(rainbow);
