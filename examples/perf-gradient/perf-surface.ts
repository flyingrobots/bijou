import { createSurface } from '@flyingrobots/bijou';

let surface: ReturnType<typeof createSurface> | undefined;
let width = 0;
let height = 0;

export function getSurface(
  nextWidth: number,
  nextHeight: number,
): ReturnType<typeof createSurface> {
  if (surface == null || width !== nextWidth || height !== nextHeight) {
    surface = createSurface(nextWidth, nextHeight);
    width = nextWidth;
    height = nextHeight;
  }
  return surface;
}

export function stampText(
  target: ReturnType<typeof createSurface>,
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
