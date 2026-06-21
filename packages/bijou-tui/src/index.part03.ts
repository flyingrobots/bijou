export { debugOverlay } from './debug-overlay.js';

export type {
  LayoutInspectorOptions,
  LayoutInspectorRect,
  LayoutInspectorRegion,
  LayoutInspectorScroll,
  LayoutInspectorXYRect,
} from './layout-inspector.js';

export {
  layoutInspectorOverlay,
  layoutInspectorText,
} from './layout-inspector.js';

export type {
  InputRoutingInspectorHistory,
  InputRoutingInspectorHistoryOptions,
  InputRoutingInspectorRecord,
  InputRoutingInspectorSurfaceOptions,
} from './input-routing-inspector.js';

export {
  appendInputRoutingRecord,
  inputRoutingInspectorSurface,
  inputRoutingInspectorText,
} from './input-routing-inspector.js';

export type {
  FocusMapIssue,
  FocusMapIssueKind,
  FocusMapNode,
  FocusMapRect,
  FocusMapReport,
  FocusMapSurfaceOptions,
  FocusMapTextOptions,
} from './focus-map.js';

export {
  focusMapSurface,
  focusMapText,
  inspectFocusMap,
} from './focus-map.js';

export type {
  SurfaceDiff,
  SurfaceDiffBounds,
  SurfaceDiffCell,
  SurfaceDiffCellKind,
  SurfaceDiffRenderMode,
  SurfaceDiffRenderOptions,
} from './surface-diff.js';

export {
  diffSurfaces,
  surfaceDiffSurface,
  surfaceDiffText,
} from './surface-diff.js';

export type {
  EvaluateSurfaceBudgetOptions,
  SurfaceBudgetMetric,
  SurfaceBudgetThresholds,
  SurfaceBudgetWarning,
} from './surface-budget.js';

export { evaluateSurfaceBudget } from './surface-budget.js';

// Shader raytrace helpers
export type {
  RaytraceVector3,
  RaytraceScreenPoint,
  RaytraceRay,
  RaytraceSphere,
  RaytracePlane,
  RaytraceShape,
  RaytraceHit,
  RaytraceLookAtRayOptions,
  RaytraceOrbitCameraRayOptions,
} from './raytrace.js';

export {
  raytraceLookAtRay,
  raytraceOrbitCameraRay,
  raytraceNearestHit,
  raytraceSphereHit,
  raytracePlaneHit,
  raytraceReflect,
  raytraceNormalize,
  raytraceLength,
  raytraceDot,
  raytraceCross,
  raytraceAdd,
  raytraceSub,
  raytraceScale,
} from './raytrace.js';

// Cell glyph fitting helpers
export type {
  CellGlyphFitMode,
  CellGlyphCandidate,
  CellGlyphFitOptions,
} from './cell-glyph-fit.js';

export {
  CELL_GLYPH_ASCII_DENSITY_RAMP,
  CELL_GLYPH_UNICODE_CANDIDATES,
  fitCellGlyph,
} from './cell-glyph-fit.js';

// Split pane layout
export {
  type SplitPaneDirection,
  type SplitPaneFocus,
  type SplitPaneState,
  type SplitPaneLayout,
  type SplitPaneOptions,
  type SplitPaneSurfaceOptions,
  createSplitPaneState,
  splitPaneSetRatio,
  splitPaneResizeBy,
  splitPaneFocusNext,
  splitPaneFocusPrev,
  splitPaneLayout,
  splitPane,
  splitPaneSurface,
} from './split-pane.js';
