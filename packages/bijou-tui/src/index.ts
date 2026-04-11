/**
 * bijou-tui — TEA-based terminal UI framework.
 *
 * Re-export all public types, functions, and constants from the bijou-tui
 * package. Import from `@flyingrobots/bijou-tui` for the full API.
 *
 * @module
 */

// Types
export type {
  App,
  Cmd,
  KeyMsg,
  ResizeMsg,
  MouseMsg,
  MouseButton,
  MouseAction,
  QuitSignal,
  RunOptions,
  RuntimeIssue,
  RuntimeIssueLevel,
  RuntimeIssueSource,
} from './types.js';
export { QUIT, isKeyMsg, isResizeMsg, isMouseMsg } from './types.js';

// Runtime engine
export type {
  ApplyRuntimeCommandBufferResult,
  ExecuteRuntimeEffectBufferResult,
  CreateRuntimeComponentContractOptions,
  CreateRuntimeComponentNodeOptions,
  RuntimeBuffers,
  RuntimeComponentAlignment,
  RuntimeComponentBlockOverflowPolicy,
  RuntimeComponentContract,
  RuntimeComponentInputContext,
  RuntimeComponentInlineOverflowPolicy,
  RuntimeComponentInteractionContract,
  RuntimeComponentKeyBindings,
  RuntimeComponentLayoutNode,
  RuntimeComponentLayoutRules,
  RuntimeComponentOverflowRules,
  RuntimeComponentPointerBindings,
  RuntimeComponentSizeMode,
  RuntimeCommandBuffer,
  RuntimeEffectBuffer,
  RetainRuntimeLayoutOptions,
  RuntimeInputEvent,
  RuntimeInputHandler,
  RuntimeInputRouteContext,
  RuntimeInputRouteOutcome,
  RuntimeInputRouteResult,
  RuntimeKeyInputEvent,
  RuntimeLayoutHit,
  RuntimeLayoutInvalidationCause,
  RuntimePointerAction,
  RuntimePointerButton,
  RuntimePointerInputEvent,
  RuntimeStateLike,
  RuntimeStateMachine,
  RuntimeRetainedLayout,
  RuntimeRetainedLayouts,
  RuntimeViewLayer,
  RuntimeStackLayer,
  RuntimeViewStack,
  PopRuntimeViewResult,
} from './runtime-engine.js';
export {
  RUNTIME_COMPONENT_ALIGNMENTS,
  RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES,
  RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES,
  RUNTIME_COMPONENT_SIZE_MODES,
  RUNTIME_LAYOUT_INVALIDATION_CAUSES,
  RUNTIME_POINTER_ACTIONS,
  RUNTIME_POINTER_BUTTONS,
  activeRuntimeView,
  appendRuntimeCommands,
  appendRuntimeEffects,
  applyRuntimeCommandBuffer,
  bufferRuntimeRouteResult,
  clearRuntimeViewsToRoot,
  createRuntimeComponentContract,
  createRuntimeComponentNode,
  createRuntimeBuffers,
  createRuntimeCommandBuffer,
  createRuntimeEffectBuffer,
  createRuntimeStateMachine,
  createRuntimeRetainedLayouts,
  createRuntimeViewStack,
  dropInactiveRuntimeLayouts,
  executeRuntimeEffectBuffer,
  getRuntimeRetainedLayout,
  getRuntimeComponentContract,
  handleRuntimeComponentInput,
  hitTestRuntimeLayout,
  invalidateRuntimeLayouts,
  listRuntimeRetainedLayouts,
  popRuntimeView,
  pushRuntimeView,
  resolveRuntimeInteractiveTarget,
  routeRuntimeInput,
  retainRuntimeLayout,
  replaceRuntimeRootView,
  replaceTopRuntimeView,
  runtimeComponentAcceptsInput,
  transitionRuntimeState,
} from './runtime-engine.js';

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
  type EventBus,
  createEventBus,
} from './eventbus.js';

// View output compatibility
export type { ViewOutput } from './view-output.js';

// Pipeline
export type { RenderState, RenderMiddleware, RenderStage, RenderPipeline } from './pipeline/pipeline.js';
export { createPipeline } from './pipeline/pipeline.js';
export { grayscaleFilter } from './pipeline/middleware/grayscale.js';

// Sub-App Composition
export type { MountOptions, MountedApp } from './subapp/mount.js';
export { mount, mapCmds, initSubApp, updateSubApp } from './subapp/mount.js';

// Motion API
export { motion } from './motion/motion.js';
export { motionMiddleware } from './pipeline/middleware/motion.js';
export type { MotionOptions } from './motion/types.js';

// Layout
export { vstack, hstack, place } from './layout.js';
export { vstackSurface, hstackSurface, placeSurface } from './surface-layout.js';
export type { HAlign, VAlign, PlaceOptions } from './layout.js';
export type { LayoutRect } from './layout-rect.js';

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

// Constraint grid layout
export {
  type GridTrack,
  type GridOptions,
  type GridSurfaceOptions,
  type GridLayoutResult,
  gridLayout,
  grid,
  gridSurface,
} from './grid.js';

// App frame shell
export {
  type FrameCommandItem,
  type FrameInputArea,
  type FrameLayerHintSource,
  type FrameLayerKind,
  type FrameLayerMetadata,
  type FrameLayerOwner,
  type FrameLayerDescriptor,
  type FrameRuntimeLayer,
  type FrameRuntimeViewStack,
  type DescribeFrameLayerStackOptions,
  type FrameHeaderStyle,
  type FrameShellTheme,
  type FrameShellThemeChange,
  type FramePage,
  type FramePageMsg,
  type FramePageUpdateResult,
  type FrameLayoutNode,
  type FrameOverlayContext,
  type FrameRuntimeNotificationOptions,
  type CreateFramedAppOptions,
  type PageTransition,
  type FramePaneScroll,
  type FrameModel,
  type FramedApp,
  type FramedAppMsg,
  type FramedAppUpdateResult,
  type FrameScopedMsg,
  type PageScopedMsg,
  activeFrameLayer,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  createFramedApp,
  underlyingFrameLayer,
} from './app-frame.js';

// Panel state (minimize/maximize)
export {
  type PanelVisibilityState,
  type PanelMaximizeState,
  createPanelVisibilityState,
  createPanelMaximizeState,
  toggleMinimized,
  minimizePane,
  restorePane,
  isMinimized,
  toggleMaximize,
} from './panel-state.js';

// Panel dock (reorder panes)
export {
  type DockDirection,
  type PanelDockState,
  createPanelDockState,
  movePaneInContainer,
  resolveChildOrder,
  findPaneContainer,
  getNodeId,
} from './panel-dock.js';

// Layout presets + session restore
export {
  type SerializedPageLayout,
  type SerializedLayoutState,
  type LayoutPreset,
  serializeLayoutState,
  restoreLayoutState,
  presetSideBySide,
  presetStacked,
  presetFocused,
} from './layout-preset.js';

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

// Keybinding manager
export {
  type KeyCombo,
  type BindingInfo,
  type KeyMap,
  type KeyMapGroup,
  createKeyMap,
  parseKeyCombo,
  formatKeyCombo,
} from './keybindings.js';

// Help generation
export {
  type BindingSource,
  type HelpOptions,
  type HelpSurfaceOptions,
  helpView,
  helpViewSurface,
  helpShort,
  helpShortSurface,
  helpFor,
  helpForSurface,
} from './help.js';

// Input stack
export {
  type InputHandler,
  type LayerOptions,
  type LayerInfo,
  type InputStack,
  createInputStack,
} from './inputstack.js';

// Pager — scrollable text viewer
export {
  type PagerState,
  type PagerOptions,
  type PagerRenderOptions,
  createPagerState,
  createPagerStateForSurface,
  pager,
  pagerSurface,
  pagerScrollBy,
  pagerScrollTo,
  pagerScrollToTop,
  pagerScrollToBottom,
  pagerPageDown,
  pagerPageUp,
  pagerSetContent,
  pagerKeyMap,
} from './pager.js';

// Panel group — multi-pane focus management
export {
  type PanelDef,
  type PanelGroupOptions,
  type PanelGroup,
  createPanelGroup,
} from './panels.js';

// Overlay compositing
export {
  type Overlay,
  type CompositeOptions,
  type ModalOptions,
  type ToastVariant,
  type ToastAnchor,
  type ToastOptions,
  type DrawerAnchor,
  type DrawerOptions,
  type TooltipDirection,
  type TooltipOptions,
  composite,
  compositeSurface,
  modal,
  toast,
  drawer,
  tooltip,
} from './overlay.js';
export {
  type InspectorDrawerOptions,
  inspectorDrawer,
} from './inspector-drawer.js';

// Notification stack overlays
export {
  type NotificationHistoryFilter,
  type NotificationVariant,
  type NotificationTone,
  type NotificationPlacement,
  type NotificationAction,
  type NotificationSpec,
  type NotificationPhase,
  type NotificationRecord,
  type NotificationState,
  type NotificationMouseTargetKind,
  type NotificationMouseTarget,
  type RenderNotificationHistoryOptions,
  type RenderNotificationStackOptions,
  countNotificationHistory,
  createNotificationState,
  pushNotification,
  dismissNotification,
  dismissFocusedNotification,
  relocateNotifications,
  cycleNotificationFocus,
  activateFocusedNotification,
  trimNotificationsToViewport,
  tickNotifications,
  hasNotifications,
  notificationsNeedTick,
  hitTestNotificationStack,
  renderNotificationHistory,
  renderNotificationHistorySurface,
  renderNotificationStack,
} from './notification.js';

// Interactive accordion
export {
  type AccordionState,
  type InteractiveAccordionOptions,
  createAccordionState,
  interactiveAccordion,
  focusNext,
  focusPrev,
  toggleFocused,
  expandAll,
  collapseAll,
  accordionKeyMap,
} from './accordion.js';

// Navigable table
export {
  type NavigableTableState,
  type NavigableTableOptions,
  type NavTableRenderOptions,
  type NavTableSurfaceOptions,
  createNavigableTableState,
  navigableTable,
  navigableTableSurface,
  navTableFocusNext,
  navTableFocusPrev,
  navTablePageDown,
  navTablePageUp,
  navTableKeyMap,
} from './navigable-table.js';

// Browsable list
export {
  type BrowsableListSurfaceOptions,
  type BrowsableListItem,
  type BrowsableListState,
  type BrowsableListOptions,
  type BrowsableListRenderOptions,
  createBrowsableListState,
  browsableList,
  browsableListSurface,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  browsableListKeyMap,
} from './browsable-list.js';

// File picker
export {
  type FilePickerSurfaceOptions,
  type FileEntry,
  type FilePickerState,
  type FilePickerOptions,
  type FilePickerRenderOptions,
  createFilePickerState,
  filePicker,
  filePickerSurface,
  fpFocusNext,
  fpFocusPrev,
  fpEnter,
  fpBack,
  filePickerKeyMap,
} from './file-picker.js';

// Scripted driver
export {
  type ScriptStep,
  type RunScriptOptions,
  type RunScriptResult,
  runScript,
} from './driver.js';

// Canvas — shader-based character grid
export {
  type ShaderFn,
  type CanvasOptions,
  canvas,
} from './canvas.js';

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
