import { createSurface, surfaceToString, type Surface } from '@flyingrobots/bijou';
import type { StylePort } from '../packages/bijou/src/ports/style.js';
import { stripAnsi, visibleLength } from '@flyingrobots/bijou-tui';

export interface FrameRenderOptions {
  readonly crop?: boolean;
  readonly padding?: number;
}

export function cropSurfaceFrame(frame: Surface, padding = 0): Surface {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      if (cell.empty) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return frame.clone();
  }

  const clippedPadding = Math.max(0, Math.floor(padding));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const next = createSurface(width + (clippedPadding * 2), height + (clippedPadding * 2));
  next.blit(frame, clippedPadding, clippedPadding, minX, minY, width, height);
  return next;
}

export function renderFrameText(
  frame: Surface,
  style: StylePort,
  options: FrameRenderOptions = {},
): string {
  const target = options.crop ? cropSurfaceFrame(frame, options.padding) : frame;
  return stripAnsi(surfaceToString(target, style));
}

export function renderFrameTexts(
  frames: readonly Surface[],
  style: StylePort,
  options: FrameRenderOptions = {},
): string[] {
  return frames.map((frame) => renderFrameText(frame, style, options));
}

export function findFrameContainingAll(
  frames: readonly string[],
  snippets: readonly string[],
): number {
  return frames.findIndex((frame) => snippets.every((snippet) => frame.includes(snippet)));
}

export function assertFrameWidth(frameText: string, width: number): void {
  const lines = frameText.split('\n');
  for (const [index, line] of lines.entries()) {
    const visible = visibleLength(line);
    if (visible !== width) {
      throw new Error(`expected frame line ${index} to be width ${width}, got ${visible}`);
    }
  }
}
