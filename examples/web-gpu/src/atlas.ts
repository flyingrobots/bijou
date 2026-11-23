import {
  createCanvasGlyphRasterizer, createGlyphAtlas, resolveCanvasGlyphEnvironment, watchGlyphAtlasEnvironment,
  type GlyphAtlas, type GlyphAtlasCssFont, type GlyphAtlasEnvironmentEvent,
} from '@flyingrobots/geordi-bijou-gpu';

/** The cell font every backend draws with. Glyph pixels depend on the host's fonts. */
export const SHOWCASE_FONT: GlyphAtlasCssFont = {
  family: 'Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace',
  sizeCssPx: 14,
  cellCssW: 9,
  cellCssH: 18,
};

/** One glyph atlas shared by every presenter the page creates. */
export interface ShowcaseAtlas {
  readonly atlas: GlyphAtlas;
  /** Physical pixels per cell, the `cellPx` a mount needs. */
  cellPx(): { readonly width: number; readonly height: number };
  /** The device pixel ratio the atlas was last resolved at. */
  dpr(): number;
  /** Invalidations from font arrival, DPR change or a manual reset, newest last. */
  readonly events: readonly GlyphAtlasEnvironmentEvent[];
  /** Start a new atlas generation, as the hostile-event control does. */
  reset(): void;
  dispose(): void;
}

/**
 * Build the atlas with Geordi's browser rasterizer and its font and DPR
 * watcher. `onMetricsChange` runs when a DPR change gives the atlas a new
 * cell size: a mount's `cellPx` is fixed, so the page mounts again.
 */
export function createShowcaseAtlas(onMetricsChange: () => void): ShowcaseAtlas {
  const environment = resolveCanvasGlyphEnvironment(SHOWCASE_FONT, window.devicePixelRatio);
  const rasterizer = createCanvasGlyphRasterizer({ font: environment.font });
  const atlas = createGlyphAtlas({ rasterizer, atlasCols: 64, atlasRows: 32, metrics: environment.metrics });
  const events: GlyphAtlasEnvironmentEvent[] = [];
  let dpr = environment.dpr;
  const watcher = watchGlyphAtlasEnvironment({
    atlas, rasterizer, font: SHOWCASE_FONT,
    onInvalidate: (event) => {
      events.push(event);
      if (event.reason === 'dpr-change') {
        dpr = event.dpr;
        onMetricsChange();
      }
    },
  });
  return {
    atlas,
    cellPx: () => ({ width: atlas.metrics.cellPxW, height: atlas.metrics.cellPxH }),
    dpr: () => dpr,
    events,
    reset: () => { atlas.invalidate(undefined, 'manual'); },
    dispose: () => { watcher.dispose(); },
  };
}
