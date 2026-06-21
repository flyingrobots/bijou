export {
  collectRuntimeViewBindings,
  dispatchRuntimeCommandIntent,
  isRuntimeCommandIntentEmission,
  isRuntimeCommandIntentRoute,
  isRuntimeViewBindingSource,
  runtimeActiveBindingLayers,
  runtimeCommandIntentEmission,
  runtimeCommandIntentRoute,
  runtimeViewBindingSource,
} from './runtime-binding.js';

// Key parsing
export { parseKey, parseMouse } from './keys.js';

// Screen control
export {
  enterScreen,
  exitScreen,
  clearAndHome,
  renderFrame,
  setCursorStyle,
  resetCursorStyle,
  type CursorShape,
  ENTER_ALT_SCREEN,
  EXIT_ALT_SCREEN,
  HIDE_CURSOR,
  SHOW_CURSOR,
  WRAP_DISABLE,
  WRAP_ENABLE,
  CLEAR_SCREEN,
  CLEAR_TO_END,
  CLEAR_LINE_TO_END,
  CLEAR_LINE,
  HOME,
  CURSOR_BLOCK,
  CURSOR_UNDERLINE,
  CURSOR_BAR,
  CURSOR_RESET,
} from './screen.js';

// Commands
export { quit, tick, batch } from './commands.js';

export {
  type ShellQuitPolicy,
  resolveShellQuitPolicy,
  shouldUseShellQuitConfirm,
  isShellQuitRequest,
  isShellQuitConfirmAccept,
  isShellQuitConfirmDismiss,
  renderShellQuitOverlay,
} from './shell-quit.js';

export {
  FRAME_I18N_CATALOG,
} from './app-frame-i18n.js';

// Runtime
export { run } from './runtime.js';

// Event bus
export {
  type BusMsg,
  type CommandBackpressureInfo,
  type CommandQueueDiagnostics,
  type EventBus,
  createEventBus,
} from './eventbus.js';

// View output compatibility
export type { ViewOutput } from './view-output.js';

// Pipeline
export type {
  RenderState,
  RenderMiddleware,
  RenderStage,
  RenderPipeline,
  RenderStageTiming,
  RenderStageCompleteHandler,
  RenderStageObserver,
  CreatePipelineOptions,
} from './pipeline/pipeline.js';

export { createPipeline, getRenderStageTimings, RENDER_STAGE_TIMINGS_KEY } from './pipeline/pipeline.js';

export { grayscaleFilter } from './pipeline/middleware/grayscale.js';

export type {
  SurfaceShader,
  SurfaceShaderContext,
  ScanlinesShaderOptions,
  FlickerShaderOptions,
  NoiseShaderOptions,
  VignetteShaderOptions,
} from './pipeline/middleware/surface-shaders.js';

export {
  surfaceShaderFilter,
  scanlines,
  flicker,
  noise,
  vignette,
} from './pipeline/middleware/surface-shaders.js';

// Sub-App Composition
export type { MountOptions, MountedApp, SubAppAdapterCases } from './subapp/mount.js';

export { mount, mapCmds, initSubApp, updateSubApp, createSubAppAdapter } from './subapp/mount.js';

// Motion API
export { motion } from './motion/motion.js';

export { motionMiddleware } from './pipeline/middleware/motion.js';

export type { MotionOptions } from './motion/types.js';

// Layout
export { vstack, hstack, place } from './layout.js';

export { contentSurface, vstackSurface, hstackSurface, placeSurface, proseSurface } from './surface-layout.js';

export type { HAlign, VAlign, PlaceOptions } from './layout.js';

export type { ProseSurfaceOptions, SurfaceContent } from './surface-layout.js';

export type { LayoutRect } from './layout-rect.js';

export type { DebugOverlayAnchor, DebugOverlayOptions } from './debug-overlay.js';
