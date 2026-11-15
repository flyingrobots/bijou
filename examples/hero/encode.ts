import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Surface } from '../../packages/bijou/src/index.js';
import { rasterizeSurface } from '../../packages/bijou-node/src/index.js';
import { applyGifPalette, createGifEncoder, quantizeColors } from '../../packages/bijou-node/src/gifenc-runtime.js';
import { encodePng } from './png.js';

/** The pixel size of one terminal cell, and the colours for cells without their own. */
export const CELL = { cellWidth: 8, cellHeight: 16, foreground: '#e5e7eb', background: '#000000' };

/**
 * Stream-encode frames to a GIF: one global palette from sampled frames, then one rasterized frame at a time.
 * `delayCs` is the frame delay in centiseconds (4 for 25 fps).
 */
export function writeGif(frames: readonly Surface[], out: string, delayCs: number): void {
  const first = frames[0];
  if (first === undefined) throw new Error('no frames to encode');
  const sampleEvery = Math.max(1, Math.floor(frames.length / 32));
  const samples = frames.filter((_, i) => i % sampleEvery === 0).map((f) => rasterizeSurface(f, CELL));
  const joined = new Uint8Array(samples.reduce((n, s) => n + s.length, 0));
  samples.reduce((offset, s) => { joined.set(s, offset); return offset + s.length; }, 0);
  const palette = quantizeColors(joined, 256, { format: 'rgb565' });
  const gif = createGifEncoder();
  for (const frame of frames) {
    gif.writeFrame(applyGifPalette(rasterizeSurface(frame, CELL), palette), first.width * CELL.cellWidth, first.height * CELL.cellHeight, { palette, delay: delayCs * 10 });
  }
  gif.finish();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(gif.bytes()));
}

/** Write PNG stills at the given times (seconds), named after the GIF with the time appended. */
export function writeStills(frames: readonly Surface[], out: string, fps: number, times: readonly number[]): void {
  for (const t of times) {
    const frame = frames.at(Math.min(frames.length - 1, Math.round(t * fps)));
    if (frame === undefined) continue;
    writeFileSync(out.replace(/\.gif$/, `-${t.toFixed(1)}s.png`), encodePng(rasterizeSurface(frame, CELL), frame.width * CELL.cellWidth, frame.height * CELL.cellHeight));
  }
}
