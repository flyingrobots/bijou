import { clipToWidth, visibleLength } from './viewport.js';

/** Clip/pad a multiline string into an array of exactly `height` lines, each `width` columns. */
export function fitBlock(content: string, width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return Array.from({ length: Math.max(0, height) }, () => '');

  const src = content.split('\n');
  const out: string[] = [];
  for (let i = 0; i < height; i++) {
    const line = src[i] ?? '';
    const clipped = clipToWidth(line, width);
    const vis = visibleLength(clipped);
    out.push(clipped + ' '.repeat(Math.max(0, width - vis)));
  }
  return out;
}
