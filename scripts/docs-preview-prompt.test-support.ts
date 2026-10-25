import type { Surface } from '../packages/bijou/src/index.js';
import { createRasterPrompt } from '../examples/docs/app-prompt-raster.js';
import { resolveLandingTheme } from '../examples/docs/app-landing-themes.js';

/** Find the complete prompt artwork in the composed frame, independently of placement. */
export function findRasterPrompt(frame: Surface): { x: number; y: number; width: number; height: number } | undefined {
  const expected = createRasterPrompt('Press [Enter]', resolveLandingTheme(0), 0, frame.width, 3);
  if (expected === undefined) throw new Error('Missing prompt fixture coverage.');
  for (let y = 0; y <= frame.height - expected.height; y++) {
    for (let x = 0; x <= frame.width - expected.width; x++) {
      let matches = true;
      for (let dy = 0; matches && dy < expected.height; dy++) {
        for (let dx = 0; dx < expected.width; dx++) {
          if (frame.get(x + dx, y + dy).char !== expected.get(dx, dy).char) { matches = false; break; }
        }
      }
      if (matches) return { x, y, width: expected.width, height: expected.height };
    }
  }
  return undefined;
}
