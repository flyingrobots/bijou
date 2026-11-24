import { CONTRAST_ERROR, CONTRAST_WARNING, contrastRatio, dimmed, parseHex, themePalette, toHex, type Rgb } from './contrast.js';
import { colorHex } from '../../packages/bijou/src/index.js';
import { isDimmedBackdropCell } from '../../packages/bijou-tui/src/overlay-backdrop.js';
import type { Rendered } from './render.js';

export type Severity = 'error' | 'warning';

export interface Finding {
  readonly severity: Severity;
  /** A stable rule id, for example `contrast` or `pipe-ansi`. */
  readonly rule: string;
  readonly message: string;
}

/** Decorative glyphs a screen reader speaks badly: box drawing, blocks, and Braille patterns. */
const DECORATIVE = /[─-▟⠀-⣿]/u;

/** (1) Is the output right for its mode? */
export function outputFindings(r: Rendered): Finding[] {
  if (r.error !== undefined) return [{ severity: 'error', rule: 'render-throws', message: `render() threw: ${r.error}` }];
  const surface = r.surface;
  const chars: string[] = [];
  if (surface !== undefined) for (let y = 0; y < surface.height; y++) for (let x = 0; x < surface.width; x++) chars.push(surface.get(x, y).char);
  const text = r.raw ?? chars.join('');
  const out: Finding[] = [];
  if (text.trim() === '') out.push({ severity: 'error', rule: 'empty', message: 'The variant drew nothing.' });
  if (text.includes('\u001b') && (r.combo.mode === 'pipe' || r.combo.mode === 'accessible')) {
    out.push({ severity: 'error', rule: `${r.combo.mode}-ansi`, message: `${r.combo.mode} output contains terminal escape sequences.` });
  }
  if (chars.includes('\u001b')) out.push({ severity: 'error', rule: 'leaked-escape', message: 'An escape character was drawn into a cell.' });
  if (r.combo.mode === 'accessible' && DECORATIVE.test(text)) {
    out.push({ severity: 'warning', rule: 'accessible-decoration', message: 'accessible output contains box-drawing, block, or Braille glyphs that a screen reader speaks badly.' });
  }
  return out;
}

/** (2) Can the text be read, and is every colour from the theme? Only interactive and static draw colour. */
export function colourFindings(r: Rendered): Finding[] {
  const surface = r.surface;
  if (surface === undefined || (r.combo.mode !== 'interactive' && r.combo.mode !== 'static')) return [];
  const base = r.ctx.surface('primary');
  const defaultFg = parseHex(base.hex) ?? [255, 255, 255];
  const defaultBg = parseHex(base.bg ?? '#000000') ?? [0, 0, 0];
  const palette = themePalette(r.ctx.theme);
  const pairs = new Map<string, { ratio: number; cells: number; dim: boolean }>();
  const offPalette = new Set<string>();
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      if (cell.empty || cell.char.trim() === '') continue;
      const fgHex = colorHex(cell.fg);
      const bgHex = colorHex(cell.bg);
      for (const hex of [fgHex, bgHex]) {
        const rgb = hex === undefined ? undefined : parseHex(hex);
        if (rgb !== undefined && !palette.has(toHex(rgb))) offPalette.add(toHex(rgb));
      }
      let fg: Rgb = (fgHex === undefined ? undefined : parseHex(fgHex)) ?? defaultFg;
      let bg: Rgb = (bgHex === undefined ? undefined : parseHex(bgHex)) ?? defaultBg;
      const modifiers = cell.modifiers ?? [];
      if (modifiers.includes('inverse')) [fg, bg] = [bg, fg];
      const dim = modifiers.includes('dim');
      // A backdrop the compositor dimmed under an overlay is not text the reader is asked to read.
      if (isDimmedBackdropCell(surface, x, y)) continue;
      if (dim) fg = dimmed(fg, bg);
      const key = `${toHex(fg)} on ${toHex(bg)}${dim ? ' (dim, as drawn)' : ''}`;
      const seen = pairs.get(key);
      pairs.set(key, { ratio: contrastRatio(fg, bg), cells: (seen?.cells ?? 0) + 1, dim });
    }
  }
  const out: Finding[] = [];
  for (const [key, pair] of pairs) {
    if (pair.ratio >= CONTRAST_WARNING) continue;
    const severity: Severity = pair.ratio < CONTRAST_ERROR ? 'error' : 'warning';
    out.push({ severity, rule: 'contrast', message: `${key}: ${pair.ratio.toFixed(2)}:1 over ${String(pair.cells)} cells (WCAG: ${severity === 'error' ? 'below 3:1' : 'below 4.5:1'}).` });
  }
  if (offPalette.size > 0) {
    out.push({ severity: 'warning', rule: 'off-palette', message: `Colours not in the theme: ${[...offPalette].sort().join(', ')}.` });
  }
  return out;
}

export function findingsFor(r: Rendered): Finding[] {
  return [...outputFindings(r), ...colourFindings(r)];
}
