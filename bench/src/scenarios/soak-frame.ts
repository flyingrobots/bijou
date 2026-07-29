import {
  renderDiff,
  type PackedSurface,
  type StylePort,
} from '@flyingrobots/bijou';
import type { CountingSink } from './_shared.js';
import {
  BLOCK,
  BODY_BG,
  BODY_FG,
  FOOTER_BG,
  FOOTER_FG,
  FOOTER_ROWS,
  HEADER_BG,
  HEADER_FG,
  HEADER_ROWS,
  H_BAR,
  paintSoakBase,
  SHADE,
  SIDEBAR_BG,
  SIDEBAR_COLUMNS,
  SIDEBAR_FG,
  V_BAR,
} from './soak-layout.js';

export interface SoakState {
  readonly current: PackedSurface;
  readonly target: PackedSurface;
  readonly sink: CountingSink;
  readonly style: StylePort;
  readonly cols: number;
  readonly rows: number;
}

export function renderSoakFrame(state: SoakState, frameIndex: number): void {
  const { current, target, sink, style, cols, rows } = state;
  if (frameIndex > 0 && frameIndex % 100 === 0) {
    target.clear();
    current.clear();
    paintSoakBase(target, cols, rows);
    renderDiff(current, target, sink, style);
    target.markAllRenderClean();
    current.markAllRenderClean();
    return;
  }

  const hotRegion = frameIndex % 4;
  const phase = frameIndex % 8;
  const headerDensity = hotRegion === 0 ? 0.4 : 0.05;
  for (let x = 0; x < cols; x++) {
    if ((x * 7 + frameIndex * 3) % 100 < headerDensity * 100) {
      const character = phase < 4 ? H_BAR : BLOCK;
      target.setRGB(x, 0, character, ...HEADER_FG, ...HEADER_BG);
    }
  }

  const sidebarDensity = hotRegion === 1 ? 0.4 : 0.05;
  for (let y = HEADER_ROWS; y < rows - FOOTER_ROWS; y++) {
    for (let x = 0; x < SIDEBAR_COLUMNS; x++) {
      if ((x * 11 + y * 7 + frameIndex * 5) % 100 < sidebarDensity * 100) {
        const character = (x + y + phase) % 3 === 0 ? V_BAR : BLOCK;
        target.setRGB(x, y, character, ...SIDEBAR_FG, ...SIDEBAR_BG);
      }
    }
  }

  const bodyDensity = hotRegion === 2 ? 0.4 : 0.05;
  const bodyStartX = SIDEBAR_COLUMNS + 1;
  const bodyEndY = rows - FOOTER_ROWS - 1;
  for (let y = HEADER_ROWS + 1; y <= bodyEndY; y++) {
    for (let x = bodyStartX; x < cols; x++) {
      if ((x * 13 + y * 11 + frameIndex * 7) % 100 < bodyDensity * 100) {
        const character = (x + y + phase) % 5 === 0 ? BLOCK : SHADE;
        target.setRGB(x, y, character, ...BODY_FG, ...BODY_BG);
      }
    }
  }

  const footerDensity = hotRegion === 3 ? 0.4 : 0.05;
  for (let x = 0; x < cols; x++) {
    if ((x * 17 + frameIndex * 11) % 100 < footerDensity * 100) {
      target.setRGB(x, rows - 1, BLOCK, ...FOOTER_FG, ...FOOTER_BG);
    }
  }

  renderDiff(current, target, sink, style);
  target.markAllRenderClean();
  current.markAllRenderClean();
}
