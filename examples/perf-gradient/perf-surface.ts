import {
  createSurface,
  type PackedSurface,
} from '@flyingrobots/bijou';

/** Canonical mutable surface used by the performance demo. */
export type PerfSurface = PackedSurface;

let surface: PerfSurface | undefined;
let width = 0;
let height = 0;

export function getSurface(
  nextWidth: number,
  nextHeight: number,
): PerfSurface {
  if (surface == null || width !== nextWidth || height !== nextHeight) {
    surface = createSurface(nextWidth, nextHeight);
    width = nextWidth;
    height = nextHeight;
  }
  return surface;
}

export function stampText(
  target: PerfSurface,
  x: number,
  y: number,
  text: string,
  foreground: string,
  background: string,
): void {
  for (let index = 0; index < text.length; index++) {
    target.set(x + index, y, {
      char: text[index] ?? ' ',
      fg: foreground,
      bg: background,
    });
  }
}
