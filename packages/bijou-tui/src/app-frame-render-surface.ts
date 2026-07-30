import {
  parseAnsiToSurface,
  resolveSafeCtx,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import type { LayoutRect } from './layout-rect.js';
import { fitBlock } from './layout-utils.js';
import { resolveDividerChar } from './split-pane.part03.js';
import {
  normalizeViewOutput,
  normalizeViewOutputInto,
  type ViewOutput,
} from './view-output.js';

export function framePaneOutputToSurface(
  output: ViewOutput,
  width: number,
  height: number,
  scratch?: Surface,
): Surface {
  return scratch == null
    ? normalizeViewOutput(output, { width, height }).surface
    : normalizeViewOutputInto(output, { width, height }, scratch).surface;
}

export function blockSurface(
  content: string,
  width: number,
  height: number,
): Surface {
  return parseAnsiToSurface(
    fitBlock(content, width, height).join('\n'),
    width,
    height,
  );
}

export function resolveFrameBackgroundToken(
  ctx: BijouContext | undefined,
): TokenValue | undefined {
  const primary = ctx?.surface('primary');
  if (primary?.bg != null || primary?.bgRGB != null) return primary;
  const secondary = ctx?.surface('secondary');
  return secondary?.bg != null || secondary?.bgRGB != null
    ? secondary
    : undefined;
}

export function resolveRenderCtx(
  ctx: BijouContext | undefined,
): BijouContext | undefined {
  return ctx ?? resolveSafeCtx();
}

export function fillSurfaceBackground(
  target: Surface,
  offsetCol: number,
  offsetRow: number,
  width: number,
  height: number,
  token: TokenValue | undefined,
): void {
  if (
    token == null ||
    width <= 0 ||
    height <= 0 ||
    (token.bg == null && token.bgRGB == null)
  )
    return;
  target.fill(
    {
      char: ' ',
      fg: token.hex,
      bg: token.bg,
      fgRGB: token.fgRGB,
      bgRGB: token.bgRGB,
      empty: false,
    },
    offsetCol,
    offsetRow,
    width,
    height,
  );
}

export function applySurfaceBackground(
  surface: Surface,
  token: TokenValue | undefined,
): Surface {
  if (token == null || (token.bg == null && token.bgRGB == null)) {
    return surface;
  }
  const hasForeground = token.hex.length > 0 || token.fgRGB != null;
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const needsBackground = cell.bg == null && cell.bgRGB == null;
      const needsForeground =
        hasForeground && cell.fg == null && cell.fgRGB == null;
      if (!needsBackground && !needsForeground) continue;
      surface.set(x, y, {
        ...cell,
        char: cell.char.length > 0 ? cell.char : ' ',
        fg: needsForeground ? token.hex : cell.fg,
        bg: needsBackground ? token.bg : cell.bg,
        fgRGB: needsForeground ? token.fgRGB : cell.fgRGB,
        bgRGB: needsBackground ? token.bgRGB : cell.bgRGB,
        empty: false,
      });
    }
  }
  return surface;
}

export function paintDivider(
  target: Surface,
  rect: LayoutRect,
  dividerChar: string | undefined,
  direction: 'row' | 'column',
): void {
  const fallback = direction === 'row' ? '│' : '─';
  const unit = resolveDividerChar(dividerChar, fallback);
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      const col = rect.col + x;
      const row = rect.row + y;
      target.set(col, row, {
        ...target.get(col, row),
        char: unit,
        empty: false,
      });
    }
  }
}
