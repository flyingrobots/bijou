// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { boxSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';

/** Draw a boxed card of text onto `surface` at a position the caller derives from the free space. Skips it when it cannot fit. */
export function stampPanel(
  surface: Surface,
  lines: readonly string[],
  ctx: BijouContext,
  place: (free: { readonly x: number; readonly y: number }) => { readonly x: number; readonly y: number },
): void {
  const width = Math.max(...lines.map((line) => line.length)) + 4;
  const height = lines.length + 2;
  // A line of only rule characters is a separator: it spans the panel's inner width, the box width less two borders.
  const text = lines.map((line) => (/^─+$/u.test(line) ? '─'.repeat(width - 2) : line));
  if (surface.width < width || surface.height < height) return;
  const at = place({ x: surface.width - width, y: surface.height - height });
  surface.blit(boxSurface(text.join('\n'), { width, ctx }), at.x, at.y);
}

/** The cell grid as braille dots: each cell is a 2 by 4 block of a grid `width * 2` wide. Returns the dot mask, 0 to 255. */
export function brailleMask(grid: Uint8Array, gridWidth: number, cellX: number, cellY: number): number {
  const dots: readonly (readonly [number, number, number])[] = [
    [0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128],
  ];
  let mask = 0;
  for (const [dx, dy, bit] of dots) {
    if ((grid[(cellY * 4 + dy) * gridWidth + cellX * 2 + dx] ?? 0) > 0) mask |= bit;
  }
  return mask;
}
