import { extname } from 'node:path';
import { FFMPEG_MP4 } from './ffmpeg-mp4.js';
import { GIFENC } from './gifenc.js';
import { IMG2WEBP } from './img2webp.js';
import type { AnimationEncoder, AnimationSink, FrameSpec } from './port.js';

export type { AnimationEncoder, AnimationSink, FrameSpec } from './port.js';

/** The adapters plugged into the encoder port. Add a codec by adding an adapter here. */
export const ENCODERS: readonly AnimationEncoder[] = [FFMPEG_MP4, IMG2WEBP, GIFENC];

/** The adapter for an output path, chosen by its extension. */
export function encoderFor(out: string): AnimationEncoder {
  const ext = extname(out).toLowerCase();
  const encoder = ENCODERS.find((e) => e.extensions.includes(ext));
  if (encoder === undefined) throw new Error(`no encoder writes ${ext || out}; use one of ${ENCODERS.flatMap((e) => e.extensions).join(', ')}`);
  return encoder;
}

/** Open a sink for `out` through the matching adapter. */
export function openAnimation(out: string, spec: FrameSpec): AnimationSink {
  return encoderFor(out).open(out, spec);
}
