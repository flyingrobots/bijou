import { createSurface, type Cell, type Surface } from '../../ports/surface.js';
import type { TokenValue } from '../theme/tokens.js';
import { graphemeClusterWidth, segmentGraphemes } from '../text/grapheme.js';

export type CellTextStyle = Pick<Cell, 'fg' | 'bg' | 'modifiers'>;

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

  for (let y = 0; y < lines.length; y++) {
    const graphemes = lineGraphemes[y]!;
    for (let x = 0; x < graphemes.length; x++) {
      surface.set(x, y, { char: graphemes[x]!, ...style, empty: false });
    }
  }

  return surface;
}

export function createSegmentSurface(segments: readonly SurfaceTextSegment[]): Surface {
  if (segments.length === 0) return createTextSurface('');

  const segmented = segments.map((segment) => ({
    style: segment.style,
    graphemes: segmentSurfaceText(segment.text ?? '', 'createSegmentSurface'),
  }));
  const width = segmented.reduce((sum, segment) => sum + segment.graphemes.length, 0);
  const surface = createSurface(width, 1);
  let x = 0;

  for (const segment of segmented) {
    for (const char of segment.graphemes) {
      surface.set(x, 0, { char, ...segment.style, empty: false });
      x++;
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
