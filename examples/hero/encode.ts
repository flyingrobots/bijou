import { writeFileSync } from 'node:fs';
import type { Surface } from '../../packages/bijou/src/index.js';
import { CELL, rasterize } from './encode-raster.js';
import { openAnimation } from './encoders/index.js';
import { encodePng } from './png.js';

export { CELL, rasterize } from './encode-raster.js';

/** A streaming recording: add Bijou surfaces, close to finish the file. The codec follows the output extension. */
export interface Recording {
  add(frame: Surface): Promise<void>;
  close(): Promise<void>;
}

/** Open a recording of `cols` × `rows` cells at `out` (.mp4, .webp, or .gif); frames show for `delayCs` each. */
export function openRecording(out: string, delayCs: number, cols: number, rows: number): Recording {
  const sink = openAnimation(out, { width: cols * CELL.cellWidth, height: rows * CELL.cellHeight, delayCs });
  return { add: (frame) => sink.add(rasterize(frame)), close: () => sink.close() };
}

/** Write frames already in memory to `out`. */
export async function writeAnimation(frames: readonly Surface[], out: string, delayCs: number): Promise<void> {
  const first = frames[0];
  if (first === undefined) throw new Error('no frames to encode');
  const recording = openRecording(out, delayCs, first.width, first.height);
  for (const frame of frames) await recording.add(frame);
  await recording.close();
}

/** Write PNG stills at the given times (seconds), named after the output with the time appended. */
export function writeStills(frames: readonly Surface[], out: string, fps: number, times: readonly number[]): void {
  for (const t of times) {
    const frame = frames.at(Math.min(frames.length - 1, Math.round(t * fps)));
    if (frame === undefined) continue;
    writeFileSync(out.replace(/\.(gif|webp|mp4)$/, `-${t.toFixed(1)}s.png`), encodePng(rasterize(frame), frame.width * CELL.cellWidth, frame.height * CELL.cellHeight));
  }
}
