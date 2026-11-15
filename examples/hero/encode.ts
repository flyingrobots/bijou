import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Surface } from '../../packages/bijou/src/index.js';
import { applyGifPalette, createGifEncoder, quantizeColors } from '../../packages/bijou-node/src/gifenc-runtime.js';
import { MonoGlyphs } from './mono-font.js';
import { rasterizeMono } from './mono-raster.js';
import { encodePng } from './png.js';

/** The pixel size of one terminal cell, and the colours for cells without their own. */
export const CELL = { cellWidth: 10, cellHeight: 20, foreground: '#e5e7eb', background: '#000000' };

// Text is drawn in JetBrains Mono; the glyph cache lives for the whole recording.
const GLYPHS = new MonoGlyphs(CELL.cellWidth, CELL.cellHeight);
/** One frame as RGBA pixels, with text in JetBrains Mono. */
export const rasterize = (frame: Surface): Uint8Array => rasterizeMono(frame, GLYPHS, CELL);

/**
 * Stream-encode frames to a GIF: one global palette from sampled frames, then one rasterized frame at a time.
 * `delayCs` is the frame delay in centiseconds (4 for 25 fps).
 */
export function writeGif(frames: readonly Surface[], out: string, delayCs: number): void {
  const first = frames[0];
  if (first === undefined) throw new Error('no frames to encode');
  const sampleEvery = Math.max(1, Math.floor(frames.length / 32));
  const samples = frames.filter((_, i) => i % sampleEvery === 0).map((f) => rasterize(f));
  const joined = new Uint8Array(samples.reduce((n, s) => n + s.length, 0));
  samples.reduce((offset, s) => { joined.set(s, offset); return offset + s.length; }, 0);
  const palette = quantizeColors(joined, 256, { format: 'rgb565' });
  const gif = createGifEncoder();
  // A run of identical frames (a slide holding still) is written once, with the run's total delay.
  let held: { indexed: Uint8Array; count: number } | undefined;
  const flush = (): void => {
    if (held !== undefined) gif.writeFrame(held.indexed, first.width * CELL.cellWidth, first.height * CELL.cellHeight, { palette, delay: delayCs * 10 * held.count });
  };
  for (const frame of frames) {
    const indexed = applyGifPalette(rasterize(frame), palette);
    if (held !== undefined && sameBytes(held.indexed, indexed)) { held.count++; continue; }
    flush();
    held = { indexed, count: 1 };
  }
  flush();
  gif.finish();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(gif.bytes()));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Write PNG stills at the given times (seconds), named after the GIF with the time appended. */
export function writeStills(frames: readonly Surface[], out: string, fps: number, times: readonly number[]): void {
  for (const t of times) {
    const frame = frames.at(Math.min(frames.length - 1, Math.round(t * fps)));
    if (frame === undefined) continue;
    writeFileSync(out.replace(/\.gif$/, `-${t.toFixed(1)}s.png`), encodePng(rasterize(frame), frame.width * CELL.cellWidth, frame.height * CELL.cellHeight));
  }
}
