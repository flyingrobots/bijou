import { fitBlock } from './layout-utils.js';

import { createSurface, sanitizeNonNegativeInt, solveSplitPaneRects } from '@flyingrobots/bijou';

import type { Surface, WritePort } from '@flyingrobots/bijou';

import { placeSurface } from './surface-layout.js';

import type { SplitPaneLayout, SplitPaneOptions, SplitPaneState, SplitPaneSurfaceOptions } from './split-pane.part01.js';

import { clamp, repeatToWidth, resolveDividerChar } from './split-pane.part03.js';
export function splitPaneLayout(
  state: SplitPaneState,
  options: Omit<SplitPaneOptions, 'paneA' | 'paneB'>,
): SplitPaneLayout {
  const layout = solveSplitPaneRects({
    direction: options.direction,
    width: options.width,
    height: options.height,
    ratio: state.ratio,
    minA: options.minA,
    minB: options.minB,
    dividerSize: options.dividerSize,
  });

  return {
    paneA: { row: layout.paneA.y, col: layout.paneA.x, width: layout.paneA.width, height: layout.paneA.height },
    divider: { row: layout.divider.y, col: layout.divider.x, width: layout.divider.width, height: layout.divider.height },
    paneB: { row: layout.paneB.y, col: layout.paneB.x, width: layout.paneB.width, height: layout.paneB.height },
  };
}
export function splitPane(state: SplitPaneState, options: SplitPaneOptions): string {
  const direction = options.direction ?? 'row';
  const fallbackDividerChar = direction === 'row' ? '│' : '─';
  const dividerUnit = resolveDividerChar(options.dividerChar, fallbackDividerChar);
  const layout = splitPaneLayout(state, options);

  const aLines = fitBlock(options.paneA(layout.paneA.width, layout.paneA.height), layout.paneA.width, layout.paneA.height);
  const bLines = fitBlock(options.paneB(layout.paneB.width, layout.paneB.height), layout.paneB.width, layout.paneB.height);

  if (direction === 'row') {
    const dividerLine = repeatToWidth(dividerUnit, Math.max(0, layout.divider.width));
    const lines: string[] = [];
    for (let r = 0; r < layout.paneA.height; r++) {
      lines.push((aLines[r] ?? '') + dividerLine + (bLines[r] ?? ''));
    }
    return lines.join('\n');
  }

  const dividerLines = Array.from({ length: layout.divider.height }, () =>
    repeatToWidth(dividerUnit, Math.max(0, layout.divider.width)),
  );

  return [...aLines, ...dividerLines, ...bLines].join('\n');
}
export function splitPaneSurface(state: SplitPaneState, options: SplitPaneSurfaceOptions): Surface {
  const width = sanitizeNonNegativeInt(options.width, 0);
  const height = sanitizeNonNegativeInt(options.height, 0);
  if (width === 0 || height === 0) return createSurface(0, 0);

  const direction = options.direction ?? 'row';
  const fallbackDividerChar = direction === 'row' ? '│' : '─';
  const dividerUnit = resolveDividerChar(options.dividerChar, fallbackDividerChar);
  const layout = splitPaneLayout(state, options);
  const result = createSurface(width, height);

  const paneA = placeSurface(options.paneA(layout.paneA.width, layout.paneA.height), {
    width: layout.paneA.width,
    height: layout.paneA.height,
  });
  const paneB = placeSurface(options.paneB(layout.paneB.width, layout.paneB.height), {
    width: layout.paneB.width,
    height: layout.paneB.height,
  });

  result.blit(paneA, layout.paneA.col, layout.paneA.row, 0, 0, layout.paneA.width, layout.paneA.height);
  result.blit(paneB, layout.paneB.col, layout.paneB.row, 0, 0, layout.paneB.width, layout.paneB.height);

  if (layout.divider.width > 0 && layout.divider.height > 0) {
    const divider = createSurface(layout.divider.width, layout.divider.height, { char: dividerUnit, empty: false });
    result.blit(divider, layout.divider.col, layout.divider.row, 0, 0, layout.divider.width, layout.divider.height);
  }

  return result;
}
export function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0.5;
  return clamp(ratio, 0, 1);
}
export function warnInvalidRatio(ratio: number, io?: WritePort): void {
  io?.writeError(
    `[bijou-tui] createSplitPaneState(): received non-finite ratio "${String(ratio)}"; falling back to 0.5.\n`,
  );
}
