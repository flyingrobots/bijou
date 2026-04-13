/**
 * Scenario: paint with a rotating theme palette via surface.set, but
 * using PRE-PARSED RGB bytes on the Cell (`fgRGB`/`bgRGB` fields).
 *
 * Identical to `paint-theme-set` except that the palette strings
 * are pre-parsed once in `setup()` into RGB tuples, and each
 * `surface.set()` call includes `fgRGB`/`bgRGB` alongside the hex
 * strings. When `encodeCellIntoBuf` sees a pre-parsed RGB, it
 * skips `inlineHexRGB` entirely.
 *
 * This is the expected shape of theme-token consumers after the
 * RE-019 cool idea lands: `surface.set(x, y, { char, ...token })`
 * where the token carries both the hex string (for DTCG/human
 * export) and the pre-parsed bytes (for the hot path).
 *
 * Delta vs `paint-theme-set` = the theme-token color cache win.
 */

import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';

type RGB = readonly [number, number, number];

interface State {
  readonly surface: Surface;
  readonly cols: number;
  readonly rows: number;
  readonly palette: readonly { hex: string; rgb: RGB }[];
  readonly bgPalette: readonly { hex: string; rgb: RGB }[];
}

const PALETTE_FG_HEX = ['#9ba9ff', '#c8c7ea', '#f4c389', '#f67f65', '#f2c572'];
const PALETTE_BG_HEX = ['#111320', '#151927', '#181d2d'];

function parseHex(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b] as const;
}

export const paintThemeSetFast: Scenario<State> = {
  id: 'paint-theme-set-fast',
  label: 'Paint: rotating theme palette via surface.set + fgRGB/bgRGB (220×58)',
  tags: ['paint', 'set', 'preparsed-rgb', 'theme-cache'],
  description:
    'Same painting as paint-theme-set but the palette is pre-parsed once in setup() and each set() call includes fgRGB/bgRGB so encodeCellIntoBuf can skip inlineHexRGB. Delta vs paint-theme-set is the theme-token color cache win (RE-019 cool idea).',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 200,

  setup(_ctx, columns = 220, rows = 58) {
    const palette = PALETTE_FG_HEX.map((hex) => ({ hex, rgb: parseHex(hex) }));
    const bgPalette = PALETTE_BG_HEX.map((hex) => ({ hex, rgb: parseHex(hex) }));
    return {
      surface: createSurface(columns, rows),
      cols: columns,
      rows,
      palette,
      bgPalette,
    };
  },

  frame(state, frameIndex) {
    const { surface, cols, rows, palette, bgPalette } = state;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const fg = palette[(x + y + frameIndex) % palette.length]!;
        const bg = bgPalette[(x + y * 2) % bgPalette.length]!;
        surface.set(x, y, {
          char: '█',
          fg: fg.hex,
          fgRGB: fg.rgb,
          bg: bg.hex,
          bgRGB: bg.rgb,
          empty: false,
        });
      }
    }
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
