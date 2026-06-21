// Transition shaders
export {
  type TransitionCell,
  type TransitionResult,
  type TransitionShaderFn,
  type TransitionOverrideRole,
  type WipeDirection,
  type BuiltinTransition,
  // Original shader instances
  wipeShader,
  dissolveShader,
  gridShader,
  fadeShader,
  meltShader,
  matrixShader,
  scrambleShader,
  // New shader instances
  radialShader,
  diamondShader,
  spiralShader,
  blindsShader,
  curtainShader,
  pixelateShader,
  typewriterShader,
  glitchShader,
  staticShader,
  // Shader factories (parameterized)
  wipe,
  radial,
  diamond,
  spiral,
  blinds,
  curtain,
  pixelate,
  typewriter,
  glitch,
  tvStatic,
  // Combinators
  reverse,
  chain,
  overlay,
  // Registry
  TRANSITION_SHADERS,
} from './transition-shaders.js';

// Status bar
export { statusBar, statusBarSurface } from './status-bar.js';

export type { StatusBarOptions } from './status-bar.js';

// Animation — spring physics & tweens
export {
  type SpringConfig,
  type SpringPreset,
  type SpringState,
  SPRING_PRESETS,
  springStep,
  createSpringState,
  resolveSpringConfig,
  type EasingFn,
  EASINGS,
  type TweenConfig,
  type TweenState,
  tweenStep,
  createTweenState,
  resolveTweenConfig,
} from './spring.js';

export {
  type SpringAnimateOptions,
  type TweenAnimateOptions,
  type AnimateOptions,
  animate,
  sequence,
} from './animate.js';

// Design language defaults
export {
  TUI_SPACING,
  COMPACT_VIEWPORT_WIDTH,
  COMPACT_VIEWPORT_HEIGHT,
  isCompactViewport,
  resolveOverlayMargin,
  resolveNotificationGap,
} from './design-language.js';

// Viewport — scrollable content pane
export {
  type ViewportContent,
  type ViewportOptions,
  type ViewportSurfaceOptions,
  type ScrollState,
  viewport,
  viewportSurface,
  createScrollState,
  createScrollStateForContent,
  scrollBy,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  pageDown,
  pageUp,
  stripAnsi,
  visibleLength,
  clipToWidth,
  sliceAnsi,
  scrollByX,
  scrollToX,
} from './viewport.js';

// Timeline — GSAP-style animation orchestration
export {
  type Position,
  type SpringTrackDef,
  type TweenTrackDef,
  type TrackDef,
  type TimelineState,
  type TimelineBuilder,
  type Timeline,
  timeline,
} from './timeline.js';

// Flexbox layout
export {
  type FlexOptions,
  type FlexChild,
  type SurfaceFlexChild,
  flex,
  flexSurface,
} from './flex.js';
