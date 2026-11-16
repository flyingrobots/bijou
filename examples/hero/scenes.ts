import { perfOverlaySurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import {
  commandPaletteSurface,
  splitPaneSurface,
  type CommandPaletteState,
  type SplitPaneState,
} from '../../packages/bijou-tui/src/index.js';
import { paintCylinderTitle } from '../docs/app-cylinder-title.js';
import type { LandingThemeTokens } from '../docs/app-landing-types.js';
import { raytraceBrailleSurface } from './raytracer-braille.js';
import { raytraceSurface } from './raytracer.js';
import { centered, chrome, filled, panel, type PerfSample } from './scenes-base.js';
import { flameScene, heatScene } from './scenes-dashboard.js';
import type { HeroPalette } from './theme.js';

export { chrome, filled, panel, writeText, type PerfSample } from './scenes-base.js';
export { DAG_FOCUS_ORDER, dagScene, dashboardScene, flameScene, heatScene } from './scenes-dashboard.js';

// ── Title ───────────────────────────────────────────────────────────────────

function landingTokens(palette: HeroPalette): LandingThemeTokens {
  return {
    id: 'hero', label: palette.label, background: palette.bg,
    waveRamp: palette.rampHexes, logoRamp: palette.rampHexes,
    promptBodyColor: palette.fg, promptAccentColor: palette.accent,
    footerMutedColor: palette.muted, footerStrongColor: palette.fg, fpsColor: palette.muted,
  };
}

/** DOGFOOD's Jacquard 12 raster-font cylinder title, with the hero tagline under it. */
export function titleScene(width: number, height: number, timeSec: number, palette: HeroPalette): Surface {
  const surface = filled(width, height, palette.bg);
  paintCylinderTitle(surface, landingTokens(palette), timeSec * 1000);
  const y = Math.min(height - 3, Math.floor(height * 0.72));
  centered(surface, y, 'TUI or not TUI?', palette.accent, palette.bg, true);
  centered(surface, y + 1, 'Terminal apps in TypeScript — that render honestly everywhere.', palette.muted, palette.bg);
  return surface;
}

export function raytraceScene(
  width: number, height: number, timeSec: number, split: SplitPaneState, braille: boolean,
  perf: PerfSample, palette: HeroPalette, ctx: BijouContext,
): Surface {
  const surface = filled(width, height, palette.bg);
  const bodyH = height - 2;
  const body = splitPaneSurface(split, {
    width, height: bodyH, minA: 30, minB: 24,
    paneA: (w, h) => braille
      ? panel(raytraceBrailleSurface(w - 2, h - 2, timeSec, palette), ' Raytracer · Braille 2×4 dots, 2 colours/cell ', palette, ctx)
      : panel(raytraceSurface(w - 2, h - 2, timeSec, palette), ' Raytracer · half-block 2 px/cell ', palette, ctx),
    paneB: (w, h) => {
      const col = filled(w, h, palette.bg);
      const top = Math.floor(h * 0.55);
      col.blit(heatScene(w, top, timeSec, palette, ctx), 0, 0);
      col.blit(flameScene(w, h - top, timeSec, palette, ctx), 0, top);
      return col;
    },
  });
  surface.blit(body, 0, 1);
  const hud = perfOverlaySurface({
    fps: perf.fps, frameTimeMs: perf.frameTimeMs, frameTimeHistory: perf.history,
    width, height, heapUsedMB: perf.heapUsedMB, rssMB: perf.rssMB,
  }, { title: 'Perf', width: 30, chartHeight: 3, borderToken: palette.accentToken, bgToken: palette.panelToken, ctx });
  surface.blit(hud, width - hud.width - 2, height - hud.height - 2);
  chrome(surface, palette, 'render lab');
  return surface;
}

export function paletteOverlay(
  base: Surface, state: CommandPaletteState, palette: HeroPalette, ctx: BijouContext,
): Surface {
  const w = Math.min(56, base.width - 8);
  const list = commandPaletteSurface(state, { width: w - 2, ctx });
  const box = panel(list, ' Command Palette ', palette, ctx);
  base.blit(box, Math.floor((base.width - box.width) / 2), Math.max(2, Math.floor(base.height * 0.22)));
  return base;
}
