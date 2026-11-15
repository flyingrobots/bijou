import { boxSurface, createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import type { HeroPalette } from './theme.js';

export interface PerfSample {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly history: readonly number[];
  readonly heapUsedMB: number;
  readonly rssMB: number;
}

export function filled(width: number, height: number, bg: string): Surface {
  const surface = createSurface(width, height);
  surface.fill({ char: ' ', bg, empty: false });
  return surface;
}

export function writeText(
  surface: Surface, x: number, y: number, text: string, fg: string, bg: string, bold = false,
): void {
  Array.from(text).forEach((char, i) => {
    if (x + i >= 0 && x + i < surface.width) {
      surface.set(x + i, y, bold ? { char, fg, bg, modifiers: ['bold'], empty: false } : { char, fg, bg, empty: false });
    }
  });
}

export function centered(surface: Surface, y: number, text: string, fg: string, bg: string, bold = false): void {
  writeText(surface, Math.floor((surface.width - Array.from(text).length) / 2), y, text, fg, bg, bold);
}

export function panel(content: Surface, title: string, palette: HeroPalette, ctx: BijouContext): Surface {
  return boxSurface(content, { title, borderToken: palette.border, bgToken: palette.panelToken, ctx });
}


// ── Chrome ──────────────────────────────────────────────────────────────────

export function chrome(surface: Surface, palette: HeroPalette, label: string): void {
  for (let x = 0; x < surface.width; x++) {
    surface.set(x, 0, { char: ' ', bg: palette.panel, empty: false });
    surface.set(x, surface.height - 1, { char: ' ', bg: palette.panel, empty: false });
  }
  writeText(surface, 1, 0, '◆ bijou', palette.accent, palette.panel, true);
  writeText(surface, 10, 0, label, palette.fg, palette.panel);
  const theme = `theme: ${palette.label}`;
  writeText(surface, surface.width - theme.length - 1, 0, theme, palette.muted, palette.panel);
  writeText(surface, 1, surface.height - 1, 'ctrl+p palette · n next focus · [ ] resize split · b braille · q quit', palette.muted, palette.panel);
}
