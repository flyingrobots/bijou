/*
 * The animation encoder port. Recorders speak only this: open a sink for a file, add rasterized frames one at a
 * time, close it. Each codec (ffmpeg MP4, img2webp WebP, gifenc GIF) is an adapter behind it, so a recording of
 * any length stays in bounded memory and recorders never name a codec.
 */

/** What every adapter needs to know about the frames it will receive. */
export interface FrameSpec {
  /** Frame size in pixels. */
  readonly width: number;
  readonly height: number;
  /** How long each added frame shows, in centiseconds (4 for 25 fps). */
  readonly delayCs: number;
}

/** One open encoding: frames arrive as RGBA pixels (width × height × 4 bytes) in display order. */
export interface AnimationSink {
  add(rgba: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

/** An adapter: the file extensions it writes and how to open a sink for one file. */
export interface AnimationEncoder {
  readonly name: string;
  readonly extensions: readonly string[];
  open(out: string, spec: FrameSpec): AnimationSink;
}

/** Collapse runs of identical frames into one frame held for the run, for codecs that store a delay per frame. */
export function holdRuns(emit: (rgba: Uint8Array, count: number) => void): { add(rgba: Uint8Array): void; flush(): void } {
  let held: { rgba: Uint8Array; count: number } | undefined;
  const same = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
  return {
    add(rgba) {
      if (held !== undefined && same(held.rgba, rgba)) { held.count++; return; }
      if (held !== undefined) emit(held.rgba, held.count);
      held = { rgba, count: 1 };
    },
    flush() {
      if (held !== undefined) emit(held.rgba, held.count);
      held = undefined;
    },
  };
}
