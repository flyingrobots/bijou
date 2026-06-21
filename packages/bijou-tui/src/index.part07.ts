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
  type NavigableTableInput,
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
  type MouseScriptStep,
  type RunScriptOptions,
  type RunScriptResult,
  type MouseMoveStepOptions,
  type MouseScriptStepOptions,
  type MouseWheelDirection,
  type TestRuntimeOptions,
  type TestRuntimeCommandResolution,
  type TestRuntimeCommandRecord,
  type TestRuntimeSnapshot,
  type TestHarness,
  mouseMove,
  mousePress,
  mouseRelease,
  mouseWheel,
  runScript,
  sgrMouse,
  testRuntime,
} from './driver.js';

// Canvas — shader-based character grid
export {
  type ShaderFn,
  type CanvasOptions,
  canvas,
} from './canvas.js';
