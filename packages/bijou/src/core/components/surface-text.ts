import { createSurface, type Cell, type Surface } from '../../ports/surface.js';
import type { TokenValue } from '../theme/tokens.js';
import { segmentGraphemes } from '../text/grapheme.js';

export type CellTextStyle = Pick<Cell, 'fg' | 'bg' | 'modifiers'>;

export interface SurfaceTextSegment {
  readonly text: string;
  readonly style?: CellTextStyle;
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
  const width = lines.reduce((max, line) => Math.max(max, segmentGraphemes(line).length), 0);
  const height = Math.max(1, lines.length);
  const surface = createSurface(width, height);

  for (let y = 0; y < lines.length; y++) {
    const graphemes = segmentGraphemes(lines[y]!);
    for (let x = 0; x < graphemes.length; x++) {
      surface.set(x, y, { char: graphemes[x]!, ...style, empty: false });
    }
  }

  return surface;
}

export function createSegmentSurface(segments: readonly SurfaceTextSegment[]): Surface {
  if (segments.length === 0) return createTextSurface('');

  const width = segments.reduce((sum, segment) => sum + segmentGraphemes(segment.text ?? '').length, 0);
  const surface = createSurface(width, 1);
  let x = 0;

  for (const segment of segments) {
    const graphemes = segmentGraphemes(segment.text ?? '');
    for (const char of graphemes) {
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
