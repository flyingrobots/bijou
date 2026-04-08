import { createSurface, type Cell, type Surface, type PackedSurface } from '../../ports/surface.js';
import type { TokenValue } from '../theme/tokens.js';
import { graphemeClusterWidth, segmentGraphemes } from '../text/grapheme.js';
import { encodeModifiers, parseHex } from '../render/packed-cell.js';

export type CellTextStyle = Pick<Cell, 'fg' | 'bg' | 'modifiers'>;

/** Pre-parsed numeric style for setRGB fast path. */
interface NumericStyle {
  fgR: number; fgG: number; fgB: number; fgSet: boolean;
  bgR: number; bgG: number; bgB: number; bgSet: boolean;
  flags: number;
}

function parseNumericStyle(style: CellTextStyle): NumericStyle | undefined {
  let fgR = 0, fgG = 0, fgB = 0, fgSet = false;
  let bgR = 0, bgG = 0, bgB = 0, bgSet = false;
  if (style.fg) {
    const rgb = parseHex(style.fg);
    if (!rgb) return undefined;
    fgR = rgb[0]; fgG = rgb[1]; fgB = rgb[2]; fgSet = true;
  }
  if (style.bg) {
    const rgb = parseHex(style.bg);
    if (!rgb) return undefined;
    bgR = rgb[0]; bgG = rgb[1]; bgB = rgb[2]; bgSet = true;
  }
  return {
    fgR, fgG, fgB, fgSet,
    bgR, bgG, bgB, bgSet,
    flags: encodeModifiers(style.modifiers),
  };
}

function isPackedSurface(s: Surface): s is PackedSurface {
  return 'buffer' in s && (s as any).buffer instanceof Uint8Array;
}

export interface SurfaceTextSegment {
  readonly text: string;
  readonly style?: CellTextStyle;
}

const SURFACE_NARROW_OVERRIDES = new Set(['✓', '✗']);

export function segmentSurfaceText(text: string, purpose: string = 'Surface text'): string[] {
  const graphemes = segmentGraphemes(text ?? '');
  const wide = graphemes.find(
    (grapheme) => graphemeClusterWidth(grapheme) !== 1 && !SURFACE_NARROW_OVERRIDES.has(grapheme),
  );
  if (wide) {
    throw new Error(`${purpose} does not yet support wide graphemes like "${wide}" in surface rendering.`);
  }
  return graphemes;
}

export function tokenToCellStyle(token: TokenValue | undefined): CellTextStyle {
  if (token == null) return {};
  return {
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers,
  };
}

export function createTextSurface(text: string, style: CellTextStyle = {}): Surface {
  const safeText = text ?? '';
  const lines = safeText.split(/\r?\n/);
  const lineGraphemes = lines.map((line) => segmentSurfaceText(line, 'createTextSurface'));
  const width = lineGraphemes.reduce((max, graphemes) => Math.max(max, graphemes.length), 0);
  const height = Math.max(1, lines.length);
  const surface = createSurface(width, height);

  // Fast path: use setRGB when surface is packed and style has valid hex colors
  const numStyle = isPackedSurface(surface) ? parseNumericStyle(style) : undefined;
  if (numStyle && isPackedSurface(surface)) {
    const { fgR, fgG, fgB, bgR, bgG, bgB, flags } = numStyle;
    const fR = numStyle.fgSet ? fgR : -1;
    const bR = numStyle.bgSet ? bgR : -1;
    for (let y = 0; y < lines.length; y++) {
      const graphemes = lineGraphemes[y]!;
      for (let x = 0; x < graphemes.length; x++) {
        surface.setRGB(x, y, graphemes[x]!, fR, fgG, fgB, bR, bgG, bgB, flags);
      }
    }
  } else {
    for (let y = 0; y < lines.length; y++) {
      const graphemes = lineGraphemes[y]!;
      for (let x = 0; x < graphemes.length; x++) {
        surface.set(x, y, { char: graphemes[x]!, ...style, empty: false });
      }
    }
  }

  return surface;
}

export function createSegmentSurface(segments: readonly SurfaceTextSegment[]): Surface {
  if (segments.length === 0) return createTextSurface('');

  const segmented = segments.map((segment) => ({
    style: segment.style,
    numStyle: segment.style ? parseNumericStyle(segment.style) : undefined,
    graphemes: segmentSurfaceText(segment.text ?? '', 'createSegmentSurface'),
  }));
  const width = segmented.reduce((sum, segment) => sum + segment.graphemes.length, 0);
  const surface = createSurface(width, 1);
  const packed = isPackedSurface(surface);
  let x = 0;

  for (const segment of segmented) {
    const ns = packed ? segment.numStyle : undefined;
    if (ns && isPackedSurface(surface)) {
      const fR = ns.fgSet ? ns.fgR : -1;
      const bR = ns.bgSet ? ns.bgR : -1;
      for (const char of segment.graphemes) {
        surface.setRGB(x, 0, char, fR, ns.fgG, ns.fgB, bR, ns.bgG, ns.bgB, ns.flags);
        x++;
      }
    } else {
      for (const char of segment.graphemes) {
        surface.set(x, 0, { char, ...segment.style, empty: false });
        x++;
      }
    }
  }

  return surface;
}

export function padSurface(
  surface: Surface,
  width: number,
  height: number,
  fill?: CellTextStyle,
): Surface {
  const result = fill == null
    ? createSurface(width, height)
    : createSurface(width, height, { char: ' ', ...fill, empty: false });
  result.blit(surface, 0, 0);
  return result;
}

export function wrapSurfaceToWidth(surface: Surface, width: number): Surface {
  if (width <= 0) return createSurface(0, Math.max(1, surface.height));
  if (surface.width <= width) return surface;

  const rows: Cell[][] = [];

  for (let y = 0; y < surface.height; y++) {
    let effectiveWidth = 0;
    for (let x = surface.width - 1; x >= 0; x--) {
      if (!surface.get(x, y).empty) {
        effectiveWidth = x + 1;
        break;
      }
    }

    if (effectiveWidth === 0) {
      rows.push([]);
      continue;
    }

    const cells: Cell[] = [];
    for (let x = 0; x < effectiveWidth; x++) {
      cells.push({ ...surface.get(x, y) });
    }

    for (let offset = 0; offset < cells.length; offset += width) {
      rows.push(cells.slice(offset, offset + width));
    }
  }

  const result = createSurface(width, Math.max(1, rows.length));
  rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      result.set(x, y, cell);
    });
  });
  return result;
}
