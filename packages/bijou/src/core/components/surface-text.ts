import {
  createSurface,
  isPackedSurface,
  type Surface,
} from '../../ports/surface.js';
import {
  graphemeClusterWidth,
  sanitizePlainTerminalText,
  segmentGraphemes,
} from '../text/grapheme.js';
import {
  parseNumericCellTextStyle,
  type CellTextStyle,
} from './surface-text-style.js';

export interface SurfaceTextSegment {
  readonly text: string;
  readonly style?: CellTextStyle;
}

// Previously overrode ✓/✗ as narrow when the Dingbats range was
// blanket-classified as wide. Now isWideChar correctly excludes
// Dingbats (they're Narrow per Unicode East Asian Width).
const SURFACE_NARROW_OVERRIDES = new Set<string>();

function segmentSanitizedSurfaceText(text: string, purpose: string): string[] {
  const graphemes = segmentGraphemes(text);
  const wide = graphemes.find(
    (grapheme) =>
      graphemeClusterWidth(grapheme) !== 1 &&
      !SURFACE_NARROW_OVERRIDES.has(grapheme),
  );
  if (wide) {
    throw new Error(
      `${purpose} does not yet support wide graphemes like "${wide}" in surface rendering.`,
    );
  }
  return graphemes;
}

/**
 * Plain surface-text boundary.
 *
 * This sanitizes untrusted terminal control sequences before segmenting visible
 * graphemes for cell writes. Callers that intentionally preserve ANSI styling
 * should use `parseAnsiToSurface()` instead.
 */
export function segmentSurfaceText(
  text: string,
  purpose = 'Surface text',
): string[] {
  return segmentSanitizedSurfaceText(sanitizePlainTerminalText(text), purpose);
}

export function createTextSurface(
  text: string,
  style: CellTextStyle = {},
): Surface {
  const safeText = sanitizePlainTerminalText(text, { preserveNewlines: true });
  const lines = safeText.split('\n');
  const lineGraphemes = lines.map((line) =>
    segmentSanitizedSurfaceText(line, 'createTextSurface'),
  );
  const width = lineGraphemes.reduce(
    (max, graphemes) => Math.max(max, graphemes.length),
    0,
  );
  const height = Math.max(1, lines.length);
  const surface = createSurface(width, height);

  // Fast path: use setRGB when surface is packed and style has valid hex colors
  const numStyle = isPackedSurface(surface)
    ? parseNumericCellTextStyle(style)
    : undefined;
  if (numStyle && isPackedSurface(surface)) {
    const { fgR, fgG, fgB, bgR, bgG, bgB, flags } = numStyle;
    // -1 signals "terminal default" to setRGB; fgG/fgB and bgG/bgB are ignored when fR/bR === -1
    const fR = numStyle.fgSet ? fgR : -1;
    const bR = numStyle.bgSet ? bgR : -1;
    for (const [y, graphemes] of lineGraphemes.entries()) {
      for (const [x, char] of graphemes.entries()) {
        surface.setRGB(x, y, char, fR, fgG, fgB, bR, bgG, bgB, flags);
      }
    }
  } else {
    for (const [y, graphemes] of lineGraphemes.entries()) {
      for (const [x, char] of graphemes.entries()) {
        surface.set(x, y, { char, ...style, empty: false });
      }
    }
  }

  return surface;
}

export function createSegmentSurface(
  segments: readonly SurfaceTextSegment[],
): Surface {
  if (segments.length === 0) return createTextSurface('');

  const segmented = segments.map((segment) => ({
    style: segment.style,
    numStyle: segment.style
      ? parseNumericCellTextStyle(segment.style)
      : undefined,
    graphemes: segmentSurfaceText(segment.text, 'createSegmentSurface'),
  }));
  const width = segmented.reduce(
    (sum, segment) => sum + segment.graphemes.length,
    0,
  );
  const surface = createSurface(width, 1);
  const packed = isPackedSurface(surface);
  let x = 0;

  for (const segment of segmented) {
    const ns = packed ? segment.numStyle : undefined;
    if (ns && isPackedSurface(surface)) {
      const fR = ns.fgSet ? ns.fgR : -1;
      const bR = ns.bgSet ? ns.bgR : -1;
      for (const char of segment.graphemes) {
        surface.setRGB(
          x,
          0,
          char,
          fR,
          ns.fgG,
          ns.fgB,
          bR,
          ns.bgG,
          ns.bgB,
          ns.flags,
        );
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

export { padSurface, wrapSurfaceToWidth } from './surface-text-layout.js';
export { tokenToCellStyle } from './surface-text-style.js';
export type { CellTextStyle } from './surface-text-style.js';
