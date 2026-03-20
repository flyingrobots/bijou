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
export { vstackV3, hstackV3 } from './layout-v3.js';
export type { HAlign, VAlign, PlaceOptions } from './layout.js';
export type { LayoutRect } from './layout-rect.js';

// Split pane layout
export {
  type SplitPaneDirection,
  type SplitPaneFocus,
  type SplitPaneState,
  type SplitPaneLayout,
  type SplitPaneOptions,
  createSplitPaneState,
  splitPaneSetRatio,
  splitPaneResizeBy,
  splitPaneFocusNext,
  splitPaneFocusPrev,
  splitPaneLayout,
  splitPane,
} from './split-pane.js';

// Constraint grid layout
export {
  type GridTrack,
  type GridOptions,
  type GridLayoutResult,
  gridLayout,
  grid,
} from './grid.js';

// App frame shell
export {
  type FrameCommandItem,
  type FramePage,
  type FrameLayoutNode,
  type FrameOverlayContext,
  type FrameRuntimeNotificationOptions,
  type CreateFramedAppOptions,
  type PageTransition,
  type FramePaneScroll,
  type FrameModel,
  createFramedApp,
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
  type CharRole,
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
export { statusBar } from './status-bar.js';
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
  type ViewportOptions,
  type ScrollState,
  viewport,
  createScrollState,
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
  flex,
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
  helpView,
  helpShort,
  helpFor,
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
  pager,
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
  modal,
  toast,
  drawer,
  tooltip,
} from './overlay.js';

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
  renderNotificationHistory,
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
  createNavigableTableState,
  navigableTable,
  navTableFocusNext,
  navTableFocusPrev,
  navTablePageDown,
  navTablePageUp,
  navTableKeyMap,
} from './navigable-table.js';

// Browsable list
export {
  type BrowsableListItem,
  type BrowsableListState,
  type BrowsableListOptions,
  type BrowsableListRenderOptions,
  createBrowsableListState,
  browsableList,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  browsableListKeyMap,
} from './browsable-list.js';

// File picker
export {
  type FileEntry,
  type FilePickerState,
  type FilePickerOptions,
  type FilePickerRenderOptions,
  createFilePickerState,
  filePicker,
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
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
  commandPalette,
  commandPaletteKeyMap,
} from './command-palette.js';

// Focus area — scrollable pane with colored gutter
export {
  type OverflowX,
  type FocusAreaState,
  type FocusAreaOptions,
  type FocusAreaRenderOptions,
  createFocusAreaState,
  focusArea,
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
