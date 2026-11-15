import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
 * Stream-encode frames to a GIF. GIF allows 256 colours per frame, so each distinct frame gets its own palette
 * from its own pixels: one shared palette across a reel of several apps and themes bands gradients and
 * anti-aliased text. `delayCs` is the frame delay in centiseconds (4 for 25 fps).
 */
export function writeGif(frames: readonly Surface[], out: string, delayCs: number): void {
  const first = frames[0];
  if (first === undefined) throw new Error('no frames to encode');
  const width = first.width * CELL.cellWidth;
  const height = first.height * CELL.cellHeight;
  const gif = createGifEncoder();
  // A run of identical frames (a slide holding still) is written once, with the run's total delay.
  let held: { rgba: Uint8Array; count: number } | undefined;
  const flush = (): void => {
    if (held === undefined) return;
    const palette = quantizeColors(held.rgba, 256, { format: 'rgb565' });
    gif.writeFrame(applyGifPalette(held.rgba, palette), width, height, { palette, delay: delayCs * 10 * held.count });
  };
  for (const frame of frames) {
    const rgba = rasterize(frame);
    if (held !== undefined && sameBytes(held.rgba, rgba)) { held.count++; continue; }
    flush();
    held = { rgba, count: 1 };
  }
  flush();
  gif.finish();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(gif.bytes()));
}

/**
 * Encode frames as a full-colour animated WebP with img2webp (`brew install webp`). Unlike GIF there is no
 * 256-colour limit. Each distinct frame becomes a PNG held for its run of identical frames.
 */
export function writeWebp(frames: readonly Surface[], out: string, delayCs: number): void {
  const first = frames[0];
  if (first === undefined) throw new Error('no frames to encode');
  const width = first.width * CELL.cellWidth;
  const height = first.height * CELL.cellHeight;
  const dir = mkdtempSync(join(tmpdir(), 'bijou-webp-'));
  const args = ['-loop', '0', '-lossy', '-q', '90', '-m', '4'];
  try {
    let held: { rgba: Uint8Array; count: number } | undefined;
    let index = 0;
    const flush = (): void => {
      if (held === undefined) return;
      const file = join(dir, `${String(index++).padStart(5, '0')}.png`);
      writeFileSync(file, encodePng(held.rgba, width, height));
      args.push('-d', String(delayCs * 10 * held.count), file);
    };
    for (const frame of frames) {
      const rgba = rasterize(frame);
      if (held !== undefined && sameBytes(held.rgba, rgba)) { held.count++; continue; }
      flush();
      held = { rgba, count: 1 };
    }
    flush();
    mkdirSync(dirname(out), { recursive: true });
    const result = spawnSync('img2webp', [...args, '-o', out], { encoding: 'utf8' });
    if (result.error !== undefined) throw new Error(`img2webp could not run (install it with: brew install webp): ${result.error.message}`);
    if (result.status !== 0) throw new Error(`img2webp failed: ${result.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Write an animation as WebP or GIF, chosen by the output file's extension. */
export function writeAnimation(frames: readonly Surface[], out: string, delayCs: number): void {
  if (out.endsWith('.webp')) writeWebp(frames, out, delayCs);
  else writeGif(frames, out, delayCs);
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
    writeFileSync(out.replace(/\.(gif|webp)$/, `-${t.toFixed(1)}s.png`), encodePng(rasterize(frame), frame.width * CELL.cellWidth, frame.height * CELL.cellHeight));
  }
}
