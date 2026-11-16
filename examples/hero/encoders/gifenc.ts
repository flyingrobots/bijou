import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyGifPalette, createGifEncoder, quantizeColors } from '../../../packages/bijou-node/src/gifenc-runtime.js';
import { holdRuns, type AnimationEncoder } from './port.js';

/**
 * GIF through Bijou's bundled gifenc. GIF allows 256 colours per frame, so each distinct frame gets its own palette
 * from its own pixels; runs of identical frames are written once with the run's delay.
 */
export const GIFENC: AnimationEncoder = {
  name: 'gifenc (GIF, 256 colours per frame)',
  extensions: ['.gif'],
  open(out, { width, height, delayCs }) {
    const gif = createGifEncoder();
    const runs = holdRuns((rgba, count) => {
      const palette = quantizeColors(rgba, 256, { format: 'rgb565' });
      gif.writeFrame(applyGifPalette(rgba, palette), width, height, { palette, delay: delayCs * 10 * count });
    });
    return {
      add(rgba) { runs.add(rgba); return Promise.resolve(); },
      close() {
        runs.flush();
        gif.finish();
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, Buffer.from(gif.bytes()));
        return Promise.resolve();
      },
    };
  },
};
