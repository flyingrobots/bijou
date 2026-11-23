// Raster glyph rendering — decoded/generated RGBA frames to terminal surfaces
export { RasterFontGlyph, type RasterFontGlyphGeometry } from './raster-font-glyph.js';
export { RasterFont, layoutRasterText, type RasterFontOptions, type PositionedRasterGlyph, type RasterTextLayout } from './raster-font.js';
export { rasterizeText, rasterTextSurface, type RasterizeTextOptions, type RasterTextSurfaceOptions } from './raster-text.js';
export {
  type RasterGlyphCharsetOrder,
  type RasterGlyphRenderer,
  type RasterGlyphCharsetRenderer,
  type RasterGlyphBrailleRenderer,
  type RasterGlyphQuadRenderer,
  type RasterGlyphFit,
  type RasterGlyphColorMode,
  type RasterGlyphDitherMode,
  type RasterToGlyphSurfaceOptions,
  type RgbaFrame,
  RASTER_GLYPH_CHARSETS,
  rasterToGlyphSurface,
  validateRasterGlyphCharset,
} from './raster-glyph.js';

// Command palette
export {
  type CommandPaletteItem,
  type CommandPaletteState,
  type CommandPaletteOptions,
  type CommandPaletteSurfaceOptions,
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
  commandPalette,
  commandPaletteSurface,
  commandPaletteKeyMap,
} from './command-palette.js';

// Focus area — scrollable pane with colored gutter
export {
  type OverflowX,
  type FocusAreaState,
  type FocusAreaOptions,
  type FocusAreaRenderOptions,
  createFocusAreaState,
  createFocusAreaStateForSurface,
  focusArea,
  focusAreaSurface,
  focusAreaScrollBy,
  focusAreaScrollTo,
  focusAreaScrollToTop,
  focusAreaScrollToBottom,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollByX,
  focusAreaScrollToX,
  focusAreaSetContent,
  focusAreaKeyMap,
} from './focus-area.js';

// DAG pane — interactive DAG viewer
export {
  type DagPaneDagOptions,
  type DagPaneState,
  type DagPaneOptions,
  type DagPaneRenderOptions,
  createDagPaneState,
  dagPane,
  dagPaneSelectChild,
  dagPaneSelectParent,
  dagPaneSelectLeft,
  dagPaneSelectRight,
  dagPaneSelectNode,
  dagPaneClearSelection,
  dagPaneScrollBy,
  dagPaneScrollToTop,
  dagPaneScrollToBottom,
  dagPanePageDown,
  dagPanePageUp,
  dagPaneScrollByX,
  dagPaneSetSource,
  dagPaneKeyMap,
} from './dag-pane.js';

// Semantic scene app — ui-scene-ir/1 projection and action dispatch
export {
  type SceneProjection,
  type SemanticSceneApp,
  type SemanticSceneCheckpoint,
  type SemanticSceneController,
  type SemanticSceneControllerOptions,
  type SemanticSceneCrash,
  type SemanticSceneCrashPhase,
  type SemanticSceneDiagnostic,
  type SemanticSceneDiagnosticCode,
  type SemanticSceneFrame,
  type SemanticSceneInvocationResult,
  type SemanticSceneStatus,
  type UiActionInvocation,
  type UiActionRequest,
  type UiActionValue,
  createSemanticSceneController,
  parseUiSceneActionAttribute,
  replaySemanticSceneActions,
  UI_SCENE_ACTION_ATTRIBUTE,
  UI_SCENE_NODE_ID_ATTRIBUTE,
} from './semantic-scene.js';
