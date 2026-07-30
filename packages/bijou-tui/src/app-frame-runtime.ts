/**
 * Stable implementation facade for the high-level TEA application frame.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and an optional frame-level command palette.
 */

export type {
  FrameCommandItem,
  FrameInputArea,
  FramePage,
} from './app-frame-page-contract.js';
export type {
  FrameLayoutNode,
  FrameOverlayContext,
} from './app-frame-layout-contract.js';
export type {
  FrameNotificationCenter,
  FrameSettingFeedback,
  FrameSettingRow,
  FrameSettingSection,
  FrameSettings,
} from './app-frame-settings-contract.js';
export type {
  FrameHeaderStyle,
  FrameShellTheme,
  FrameShellThemeChange,
  FrameShellThemeFamily,
  FrameShellThemeMode,
  FrameShellThemeModeSupport,
  FrameShellThemeSpec,
} from './app-frame-theme-contract.js';
export { FRAME_SHELL_THEME_MODE_SUPPORT } from './app-frame-theme-contract.js';
export type { FrameRuntimeNotificationOptions } from './app-frame-notification-contract.js';
export type { PageTransition } from './app-frame-transition-contract.js';
export type { CreateFramedAppOptions } from './app-frame-options.js';
export type {
  FramePerfHudOverlayOptions,
  FramePerfHudTelemetry,
  FrameTimingSnapshot,
} from './app-frame-performance.js';
export {
  renderFramePerfHudOverlay,
  summarizeFrameTimings,
} from './app-frame-performance.js';
export type {
  FrameAction,
  FrameModel,
  FrameNotificationSpec,
  FramePaneScroll,
  FramePageMsg,
  FramePageUpdateResult,
  FramedApp,
  FramedAppRunOptions,
  FramedAppMsg,
  FramedAppUpdateResult,
  FrameScopedMsg,
  PageScopedMsg,
} from './app-frame-types.js';
export {
  FRAME_MSG_TOKEN,
  PAGE_MSG_TOKEN,
  emitMsg,
  emitFrameAction,
  emitMsgForPage,
  isFrameScopedMsg,
  isPageScopedMsg,
  notify,
  wrapCmdForPage,
  wrapFrameMsg,
  wrapPageMsg,
} from './app-frame-types.js';
export type {
  FrameControlProjection,
  FrameLayerHintSource,
  FrameLayerKind,
  FrameLayerMetadata,
  FrameLayerOwner,
  FrameLayerDescriptor,
  FramePageLayerKind,
  FramePageLayerRegistry,
  FrameRuntimeLayer,
  FrameRuntimeViewStack,
  DescribeFrameLayerStackOptions,
} from './app-frame-layers.js';
export {
  activeFrameLayer,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  projectFrameControls,
  underlyingFrameLayer,
} from './app-frame-layers.js';
export { createFramedApp, runFramedApp } from './app-frame-create.js';
