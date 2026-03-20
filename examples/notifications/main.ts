import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd, resolveClock } from '@flyingrobots/bijou';
import {
  activateFocusedNotification,
  countNotificationHistory,
  createFramedApp,
  createKeyMap,
  createNotificationState,
  cycleNotificationFocus,
  dismissFocusedNotification,
  dismissNotification,
  modal,
  notificationsNeedTick,
  pushNotification,
  relocateNotifications,
  renderNotificationHistory,
  quit,
  renderNotificationStack,
  run,
  tick,
  tickNotifications,
  trimNotificationsToViewport,
  type Cmd,
  type FramePage,
  type NotificationHistoryFilter,
  type NotificationPlacement,
  type NotificationSpec,
  type NotificationState,
  type NotificationTone,
  type NotificationVariant,
} from '@flyingrobots/bijou-tui';

export const ctx = initDefaultContext();

const NOTIFICATION_TICK_MS = 40;

const VARIANTS: readonly NotificationVariant[] = ['ACTIONABLE', 'INLINE', 'TOAST'];
const TONES: readonly NotificationTone[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
const PLACEMENTS: readonly NotificationPlacement[] = [
  'UPPER_LEFT',
  'UPPER_RIGHT',
  'LOWER_LEFT',
  'LOWER_RIGHT',
  'TOP_CENTER',
  'BOTTOM_CENTER',
  'CENTER',
];

const HISTORY_FILTERS: readonly NotificationHistoryFilter[] = [
  'ALL',
  'ACTIONABLE',
  'ERROR',
  'WARNING',
  'SUCCESS',
  'INFO',
];

const DURATION_OPTIONS = [
  { label: 'default', value: undefined },
  { label: 'persistent', value: null },
  { label: '2.5s', value: 2_500 },
  { label: '5.0s', value: 5_000 },
  { label: '9.0s', value: 9_000 },
] as const;

const COMPACT_DEMO_WIDTH = 52;
const COMPACT_DEMO_HEIGHT = 16;
const COMPACT_OVERLAY_MARGIN = 1;
const DEFAULT_OVERLAY_MARGIN = 2;
const DEMO_NOTIFICATION_GAP = 1;

function isCompactDemoViewport(width: number, height: number): boolean {
  return width < COMPACT_DEMO_WIDTH || height < COMPACT_DEMO_HEIGHT;
}

function demoOverlayMargin(width: number, height: number): number {
  return isCompactDemoViewport(width, height)
    ? COMPACT_OVERLAY_MARGIN
    : DEFAULT_OVERLAY_MARGIN;
}

type Msg =
  | { type: 'spawn-notification' }
  | { type: 'cycle-variant' }
  | { type: 'cycle-tone' }
  | { type: 'cycle-placement' }
  | { type: 'cycle-duration' }
  | { type: 'toggle-action' }
  | { type: 'toggle-wrap' }
  | { type: 'open-history' }
  | { type: 'close-history' }
  | { type: 'history-next' }
  | { type: 'history-prev' }
  | { type: 'history-page-down' }
  | { type: 'history-page-up' }
  | { type: 'cycle-history-filter' }
  | { type: 'focus-next' }
  | { type: 'focus-prev' }
  | { type: 'activate-focused' }
  | { type: 'dismiss-notification' }
  | { type: 'notification-tick' }
  | { type: 'key-observed'; key: string; route: string }
  | { type: 'quit-app' }
  | { type: 'notification-action'; ordinal: number };

const pageKeyMap = createKeyMap<Msg>()
  .bind('n', 'Spawn notification', { type: 'spawn-notification' })
  .bind('v', 'Cycle variant', { type: 'cycle-variant' })
  .bind('t', 'Cycle tone', { type: 'cycle-tone' })
  .bind('l', 'Cycle placement', { type: 'cycle-placement' })
  .bind('d', 'Cycle duration', { type: 'cycle-duration' })
  .bind('a', 'Toggle action button', { type: 'toggle-action' })
  .bind('w', 'Toggle text wrap', { type: 'toggle-wrap' })
  .bind('shift+h', 'Open notification history', { type: 'open-history' })
  .bind('j', 'Focus next actionable notification', { type: 'focus-next' })
  .bind('k', 'Focus previous actionable notification', { type: 'focus-prev' })
  .bind('enter', 'Run focused notification action', { type: 'activate-focused' })
  .bind('x', 'Dismiss focused/latest notification', { type: 'dismiss-notification' })
  .bind('q', 'Quit demo / Close history', { type: 'quit-app' });

const historyKeyMap = createKeyMap<Msg>()
  .bind('escape', 'Close history center', { type: 'close-history' })
  .bind('q', 'Close history center', { type: 'close-history' })
  .bind('up', 'Scroll history up', { type: 'history-prev' })
  .bind('down', 'Scroll history down', { type: 'history-next' })
  .bind('j', 'Scroll history down', { type: 'history-next' })
  .bind('k', 'Scroll history up', { type: 'history-prev' })
  .bind('pageup', 'History page up', { type: 'history-page-up' })
  .bind('pagedown', 'History page down', { type: 'history-page-down' })
  .bind('f', 'Cycle history filter', { type: 'cycle-history-filter' });

interface PageModel {
  readonly notifications: NotificationState<Msg>;
  readonly notificationLoopActive: boolean;
  readonly variantIndex: number;
  readonly toneIndex: number;
  readonly placementIndex: number;
  readonly durationIndex: number;
  readonly actionEnabled: boolean;
  readonly wrapText: boolean;
  readonly historyOpen: boolean;
  readonly historyScroll: number;
  readonly historyFilterIndex: number;
  readonly nextOrdinal: number;
  readonly lastHandledInput: string;
  readonly log: readonly string[];
}

function createInitialPageModel(): PageModel {
  return {
    notifications: createNotificationState<Msg>(),
    notificationLoopActive: false,
    variantIndex: 0,
    toneIndex: 0,
    placementIndex: 3,
    durationIndex: 0,
    actionEnabled: true,
    wrapText: true,
    historyOpen: false,
    historyScroll: 0,
    historyFilterIndex: 0,
    nextOrdinal: 1,
    lastHandledInput: 'none',
    log: [
      'Notification lab ready.',
      'Press n to spawn a new notification.',
    ],
  };
}

function currentVariant(model: PageModel): NotificationVariant {
  return VARIANTS[model.variantIndex]!;
}

function currentTone(model: PageModel): NotificationTone {
  return TONES[model.toneIndex]!;
}

function currentPlacement(model: PageModel): NotificationPlacement {
  return PLACEMENTS[model.placementIndex]!;
}

function currentDuration(model: PageModel) {
  return DURATION_OPTIONS[model.durationIndex]!;
}

function currentHistoryFilter(model: PageModel): NotificationHistoryFilter {
  return HISTORY_FILTERS[model.historyFilterIndex]!;
}

function maxHistoryScroll(model: PageModel): number {
  return Math.max(0, countNotificationHistory(model.notifications, currentHistoryFilter(model)) - 1);
}

function clampHistoryScroll(model: PageModel, nextScroll: number): number {
  return Math.max(0, Math.min(nextScroll, maxHistoryScroll(model)));
}

function toneCopy(tone: NotificationTone): { readonly title: string; readonly message: string } {
  switch (tone) {
    case 'INFO':
      return {
        title: 'Background sync ready',
        message: 'Fresh data is available for review.',
      };
    case 'SUCCESS':
      return {
        title: 'Release shipped cleanly',
        message: 'All checks passed and artifacts are live.',
      };
    case 'WARNING':
      return {
        title: 'Queue pressure rising',
        message: 'Latency is trending upward on the worker pool.',
      };
    case 'ERROR':
      return {
        title: 'Deploy blocked',
        message: 'The runtime failed to boot the latest candidate.',
      };
  }
}

function actionLabelForTone(tone: NotificationTone): string {
  switch (tone) {
    case 'INFO':
      return 'Open details';
    case 'SUCCESS':
      return 'Share result';
    case 'WARNING':
      return 'Inspect queue';
    case 'ERROR':
      return 'Retry deploy';
  }
}

function formatDurationLabel(value: number | null | undefined): string {
  if (value === undefined) return 'default';
  if (value === null) return 'persistent';
  return `${(value / 1000).toFixed(1)}s`;
}

function appendLog(model: PageModel, message: string): PageModel {
  return {
    ...model,
    log: [message, ...model.log].slice(0, 12),
  };
}

function recordInput(model: PageModel, key: string, message: string): PageModel {
  return appendLog({
    ...model,
    lastHandledInput: key,
  }, `[${key}] ${message}`);
}

function openHistory(model: PageModel, key: string): PageModel {
  return recordInput({
    ...model,
    historyOpen: true,
    historyScroll: clampHistoryScroll(model, model.historyScroll),
  }, key, `Opened notification history (${countNotificationHistory(model.notifications, currentHistoryFilter(model))} items).`);
}

function blocksBehindHistory(msg: Msg): boolean {
  switch (msg.type) {
    case 'open-history':
    case 'close-history':
    case 'history-next':
    case 'history-prev':
    case 'history-page-down':
    case 'history-page-up':
    case 'cycle-history-filter':
    case 'key-observed':
    case 'quit-app':
      return false;
    default:
      return true;
  }
}

function renderControlsPane(model: PageModel, width: number, notificationCtx = ctx): string {
  const activeVariant = currentVariant(model);
  const activeTone = currentTone(model);
  const activePlacement = currentPlacement(model);
  const nextPlacement = PLACEMENTS[(model.placementIndex + 1) % PLACEMENTS.length]!;
  const activeDuration = currentDuration(model);
  const historyFilter = currentHistoryFilter(model);
  const focused = model.notifications.focusedId == null
    ? 'none'
    : `#${model.notifications.focusedId}`;
  const lines = [
    'Notification Lab',
    '',
    `Variant : ${activeVariant}`,
    `Tone    : ${activeTone}`,
    `Next at : ${activePlacement}`,
    `Cycle   : ${nextPlacement}`,
    `Stay    : ${activeDuration.label}`,
    `Action  : ${model.actionEnabled ? 'enabled' : 'disabled'}`,
    `Wrap    : ${model.wrapText ? 'enabled' : 'disabled'}`,
    `Stack   : ${model.notifications.items.length}`,
    `History : ${model.notifications.history.length}`,
    `Center  : ${model.historyOpen ? 'open' : 'closed'} (${historyFilter})`,
    `Focus   : ${focused}`,
    `Last key: ${model.lastHandledInput}`,
    '',
    `${kbd('n')} spawn`,
    `${kbd('v')} cycle variant`,
    `${kbd('t')} cycle tone`,
    `${kbd('l')} cycle placement`,
    `${kbd('d')} cycle duration`,
    `${kbd('a')} toggle action`,
    `${kbd('w')} toggle wrap`,
    `${kbd('shift+h')} open history center`,
    `${kbd('j')} / ${kbd('k')} focus action`,
    `${kbd('enter')} run action`,
    `${kbd('x')} dismiss focused/latest`,
    `${kbd('q')} quit`,
    '',
    'Try stacking a few in the same corner, then',
    'flip placements to compare the anchor behavior.',
  ];

  return box(lines.join('\n'), {
    width,
    title: 'Controls',
    overflow: model.wrapText ? 'wrap' : 'truncate',
    ctx: notificationCtx,
  });
}

function renderLogPane(model: PageModel, width: number, notificationCtx = ctx): string {
  const lines = [
    'Recent events',
    '',
    ...model.log,
  ];

  return box(lines.join('\n'), {
    width,
    title: 'Activity',
    overflow: model.wrapText ? 'wrap' : 'truncate',
    ctx: notificationCtx,
  });
}

function renderHistoryModal(
  model: PageModel,
  screenWidth: number,
  screenHeight: number,
  notificationCtx = ctx,
) {
  const filter = currentHistoryFilter(model);
  const compact = isCompactDemoViewport(screenWidth, screenHeight);
  const edgeMargin = demoOverlayMargin(screenWidth, screenHeight);
  const title = compact ? 'History' : `Notification History (${filter})`;
  const hint = compact
    ? 'Up/Down • PgUp/PgDn • f • Esc'
    : 'Up/Down scroll • PageUp/PageDown jump • f filter • Esc close';
  const headerRows = 2;
  const hintRows = 2;
  const borderRows = 2;
  const modalWidth = Math.max(12, Math.min(96, Math.max(12, screenWidth - (edgeMargin * 2))));
  const bodyWidth = Math.max(1, modalWidth - 4);
  const bodyHeight = Math.max(
    1,
    Math.min(20, screenHeight - borderRows - headerRows - hintRows),
  );

  return modal({
    title,
    body: renderNotificationHistory(model.notifications, {
      width: bodyWidth,
      height: bodyHeight,
      scroll: model.historyScroll,
      filter,
      ctx: notificationCtx,
    }),
    hint,
    width: modalWidth,
    screenWidth,
    screenHeight,
    ctx: notificationCtx,
  });
}

function applyNotificationState(
  model: PageModel,
  notifications: NotificationState<Msg>,
  notificationCtx = ctx,
  commands: readonly Cmd<Msg>[] = [],
  forceTick = false,
): [PageModel, Cmd<Msg>[]] {
  const clock = resolveClock(notificationCtx);
  const trimmed = trimNotificationsToViewport(notifications, {
    screenWidth: notificationCtx.runtime.columns,
    screenHeight: Math.max(0, notificationCtx.runtime.rows - 2),
    margin: demoOverlayMargin(
      notificationCtx.runtime.columns,
      Math.max(0, notificationCtx.runtime.rows - 2),
    ),
    gap: DEMO_NOTIFICATION_GAP,
    ctx: notificationCtx,
  }, clock.now());
  const needsTick = notificationsNeedTick(trimmed);
  const nextModel: PageModel = {
    ...model,
    notifications: trimmed,
    notificationLoopActive: needsTick,
    historyScroll: clampHistoryScroll({
      ...model,
      notifications: trimmed,
    }, model.historyScroll),
  };
  const shouldScheduleTick = needsTick && (forceTick || !model.notificationLoopActive);

  return [
    nextModel,
    shouldScheduleTick
      ? [...commands, tick(NOTIFICATION_TICK_MS, { type: 'notification-tick' })]
      : [...commands],
  ];
}

function spawnConfiguredNotification(
  model: PageModel,
  notificationCtx = ctx,
): [PageModel, Cmd<Msg>[]] {
  const clock = resolveClock(notificationCtx);
  const ordinal = model.nextOrdinal;
  const variant = currentVariant(model);
  const tone = currentTone(model);
  const placement = currentPlacement(model);
  const duration = currentDuration(model);
  const copy = toneCopy(tone);
  const spec: NotificationSpec<Msg> = {
    title: `${copy.title} #${ordinal}`,
    message: `${copy.message} ${variant} @ ${placement} • ${duration.label}`,
    variant,
    tone,
    placement,
    durationMs: duration.value,
    action: variant === 'ACTIONABLE' && model.actionEnabled
      ? {
        label: actionLabelForTone(tone),
        payload: { type: 'notification-action', ordinal },
      }
      : undefined,
    overflow: model.wrapText ? 'wrap' : 'truncate',
  };

  const notifications = pushNotification(model.notifications, spec, clock.now());
  const nextModel = appendLog({
    ...model,
    lastHandledInput: 'n',
    notifications,
    nextOrdinal: ordinal + 1,
  }, `[n] Spawned ${variant} #${ordinal} at ${placement} (${formatDurationLabel(duration.value)}).`);

  return applyNotificationState(nextModel, notifications, notificationCtx);
}

function dismissCurrentNotification(
  model: PageModel,
  notificationCtx = ctx,
): [PageModel, Cmd<Msg>[]] {
  const nowMs = resolveClock(notificationCtx).now();
  const latest = model.notifications.items.at(-1);
  const notifications = model.notifications.focusedId != null
    ? dismissFocusedNotification(model.notifications, nowMs)
    : (latest == null ? model.notifications : dismissNotification(model.notifications, latest.id, nowMs));

  if (notifications === model.notifications) return [model, []];

  const nextModel = recordInput({
    ...model,
    notifications,
  }, 'x', 'Dismissed a notification.');

  return applyNotificationState(nextModel, notifications, notificationCtx);
}

function seedDemoNotifications(model: PageModel, notificationCtx = ctx): PageModel {
  const entries = [
    {
      title: 'Deploy blocked',
      message: 'Retryable actionable notice in the upper right.',
      variant: 'ACTIONABLE' as const,
      tone: 'ERROR' as const,
      placement: 'UPPER_RIGHT' as const,
      durationMs: null,
      actionLabel: 'Retry deploy',
    },
    {
      title: 'Queue pressure rising',
      message: 'Inline notice centered at the top edge.',
      variant: 'INLINE' as const,
      tone: 'WARNING' as const,
      placement: 'TOP_CENTER' as const,
      durationMs: 5_000,
    },
    {
      title: 'Release shipped cleanly',
      message: 'Toast variant stacked near the lower-right anchor.',
      variant: 'TOAST' as const,
      tone: 'SUCCESS' as const,
      placement: 'LOWER_RIGHT' as const,
      durationMs: 4_000,
    },
  ] as const;

  let next = model;
  let nowMs = resolveClock(notificationCtx).now();

  for (const entry of entries) {
    const ordinal = next.nextOrdinal;
    const notifications = pushNotification(next.notifications, {
      title: `${entry.title} #${ordinal}`,
      message: entry.message,
      variant: entry.variant,
      tone: entry.tone,
      placement: entry.placement,
      durationMs: entry.durationMs,
      action: !('actionLabel' in entry) || entry.actionLabel == null
        ? undefined
        : {
          label: entry.actionLabel,
          payload: { type: 'notification-action', ordinal },
        },
      overflow: next.wrapText ? 'wrap' : 'truncate',
    }, nowMs);

    next = appendLog({
      ...next,
      notifications,
      nextOrdinal: ordinal + 1,
    }, `Seeded ${entry.variant} #${ordinal} for automated smoke rendering.`);

    nowMs += 60;
  }

  return next;
}

export function createNotificationDemoApp(
  notificationCtx = ctx,
  options: { readonly autoDemo?: boolean } = {},
) {
  const autoDemo = options.autoDemo ?? (
    notificationCtx.runtime.env('CI') === '1' || process.env.CI === '1'
  );

  const page: FramePage<PageModel, Msg> = {
    id: 'notifications',
    title: 'Notifications',
    init() {
      const seeded = autoDemo
        ? seedDemoNotifications(createInitialPageModel(), notificationCtx)
        : createInitialPageModel();
      const [model, cmds] = applyNotificationState(seeded, seeded.notifications, notificationCtx);
      return [
        model,
        autoDemo ? [...cmds, tick(1_600, { type: 'quit-app' })] : cmds,
      ];
    },
    update(msg, model) {
      if (model.historyOpen && blocksBehindHistory(msg)) {
        return [model, []];
      }

      switch (msg.type) {
      case 'spawn-notification':
        return spawnConfiguredNotification(model, notificationCtx);
      case 'cycle-variant':
        return [recordInput({
          ...model,
          variantIndex: (model.variantIndex + 1) % VARIANTS.length,
        }, 'v', `Variant -> ${VARIANTS[(model.variantIndex + 1) % VARIANTS.length]!}.`), []];
      case 'cycle-tone':
        return [recordInput({
          ...model,
          toneIndex: (model.toneIndex + 1) % TONES.length,
        }, 't', `Tone -> ${TONES[(model.toneIndex + 1) % TONES.length]!}.`), []];
      case 'cycle-placement':
      {
        const nextPlacementIndex = (model.placementIndex + 1) % PLACEMENTS.length;
        const nextPlacement = PLACEMENTS[nextPlacementIndex]!;
        const notifications = relocateNotifications(
          model.notifications,
          nextPlacement,
          resolveClock(notificationCtx).now(),
        );
        const nextModel = appendLog({
          ...model,
          lastHandledInput: 'l',
          placementIndex: nextPlacementIndex,
          notifications,
        }, `[l] Placement -> ${nextPlacement}; active notifications relocated.`);
        return applyNotificationState(nextModel, notifications, notificationCtx);
      }
      case 'cycle-duration':
        return [recordInput({
          ...model,
          durationIndex: (model.durationIndex + 1) % DURATION_OPTIONS.length,
        }, 'd', `Duration -> ${DURATION_OPTIONS[(model.durationIndex + 1) % DURATION_OPTIONS.length]!.label}.`), []];
      case 'toggle-action':
        return [recordInput({
          ...model,
          actionEnabled: !model.actionEnabled,
        }, 'a', `Action button ${!model.actionEnabled ? 'enabled' : 'disabled'}.`), []];
      case 'toggle-wrap':
        return [recordInput({
          ...model,
          wrapText: !model.wrapText,
        }, 'w', `Wrap ${!model.wrapText ? 'enabled' : 'disabled'}.`), []];
      case 'open-history':
        return [openHistory(model, 'shift+h'), []];
      case 'close-history':
        if (!model.historyOpen) return [model, []];
        return [recordInput({
          ...model,
          historyOpen: false,
        }, 'escape', 'Closed notification history.'), []];
      case 'history-next':
        if (!model.historyOpen) return [model, []];
        return [{
          ...model,
          historyScroll: clampHistoryScroll(model, model.historyScroll + 1),
        }, []];
      case 'history-prev':
        if (!model.historyOpen) return [model, []];
        return [{
          ...model,
          historyScroll: clampHistoryScroll(model, model.historyScroll - 1),
        }, []];
      case 'history-page-down':
        if (!model.historyOpen) return [model, []];
        return [{
          ...model,
          historyScroll: clampHistoryScroll(model, model.historyScroll + 5),
        }, []];
      case 'history-page-up':
        if (!model.historyOpen) return [model, []];
        return [{
          ...model,
          historyScroll: clampHistoryScroll(model, model.historyScroll - 5),
        }, []];
      case 'cycle-history-filter':
        if (!model.historyOpen) return [model, []];
        return [recordInput({
          ...model,
          historyFilterIndex: (model.historyFilterIndex + 1) % HISTORY_FILTERS.length,
          historyScroll: 0,
        }, 'f', `History filter -> ${HISTORY_FILTERS[(model.historyFilterIndex + 1) % HISTORY_FILTERS.length]!}.`), []];
      case 'focus-next':
        if (model.historyOpen) {
          return [{
            ...model,
            historyScroll: clampHistoryScroll(model, model.historyScroll + 1),
          }, []];
        }
        return [recordInput({
          ...model,
          notifications: cycleNotificationFocus(model.notifications, 1),
        }, 'j', 'Focused next actionable notification.'), []];
      case 'focus-prev':
        if (model.historyOpen) {
          return [{
            ...model,
            historyScroll: clampHistoryScroll(model, model.historyScroll - 1),
          }, []];
        }
        return [recordInput({
          ...model,
          notifications: cycleNotificationFocus(model.notifications, -1),
        }, 'k', 'Focused previous actionable notification.'), []];
      case 'dismiss-notification':
        return dismissCurrentNotification(model, notificationCtx);
      case 'activate-focused': {
        const result = activateFocusedNotification(model.notifications, resolveClock(notificationCtx).now());
        let nextModel = {
          ...model,
          notifications: result.state,
        };

        if (result.payload?.type === 'notification-action') {
          nextModel = recordInput(nextModel, 'enter', `Action fired from notification #${result.payload.ordinal}.`);
        }

        return applyNotificationState(nextModel, nextModel.notifications, notificationCtx);
      }
      case 'notification-action':
        return [appendLog(model, `Notification #${msg.ordinal} delivered its action payload.`), []];
      case 'notification-tick': {
        const notifications = tickNotifications(model.notifications, resolveClock(notificationCtx).now());
        return applyNotificationState({
          ...model,
          notifications,
        }, notifications, notificationCtx, [], true);
      }
      case 'key-observed':
        return [appendLog({
          ...model,
          lastHandledInput: `${msg.key}:${msg.route}`,
        }, `[key ${msg.key}] route=${msg.route}`), []];
      case 'quit-app':
        if (model.historyOpen) {
          return [recordInput({
            ...model,
            historyOpen: false,
          }, 'q', 'Closed notification history.'), []];
        }
        return [model, [quit()]];
      default:
        return [model, []];
    }
    },
    keyMap: pageKeyMap,
    commandItems(model) {
      return [{
        id: 'view-history',
        label: 'View notifications history',
        description: `${countNotificationHistory(model.notifications, currentHistoryFilter(model))} archived notifications`,
        category: 'Notifications',
        action: { type: 'open-history' },
      }];
    },
    layout(model) {
      return {
        kind: 'grid',
        gridId: 'notification-lab',
        columns: [38, '1fr'],
        rows: ['1fr'],
        areas: ['controls activity'],
        gap: 1,
        cells: {
          controls: {
            kind: 'pane',
            paneId: 'controls',
            render: (width) => renderControlsPane(model, width, notificationCtx),
          },
          activity: {
            kind: 'pane',
            paneId: 'activity',
            render: (width) => renderLogPane(model, width, notificationCtx),
          },
        },
      };
    },
  };

  return createFramedApp<PageModel, Msg>({
    title: 'Bijou Notification Lab',
    pages: [page],
    initialColumns: notificationCtx.runtime.columns,
    initialRows: notificationCtx.runtime.rows,
    keyPriority: 'page-first',
    helpLineSource: ({ model, activePage }) => {
      const pageModel = model.pageModels[model.activePageId] as PageModel | undefined;
      if (pageModel?.historyOpen) return historyKeyMap;
      return activePage.helpSource ?? activePage.keyMap;
    },
    observeKey: (msg, route) => ({
      type: 'key-observed',
      key: `${msg.ctrl ? 'ctrl+' : ''}${msg.alt ? 'alt+' : ''}${msg.shift ? 'shift+' : ''}${msg.key}`,
      route,
    }),
    enableCommandPalette: true,
    overlayFactory(frame) {
      const paneRects = [...frame.paneRects.values()];
      const region = paneRects.length === 0
        ? frame.screenRect
        : {
          col: Math.min(...paneRects.map((rect) => rect.col)),
          row: Math.min(...paneRects.map((rect) => rect.row)),
          width: Math.max(...paneRects.map((rect) => rect.col + rect.width)) - Math.min(...paneRects.map((rect) => rect.col)),
          height: Math.max(...paneRects.map((rect) => rect.row + rect.height)) - Math.min(...paneRects.map((rect) => rect.row)),
        };

      const overlays = [...renderNotificationStack(frame.pageModel.notifications, {
        screenWidth: frame.screenRect.width,
        screenHeight: frame.screenRect.height,
        region,
        margin: 2,
        gap: 1,
        ctx: notificationCtx,
      })];

      if (frame.pageModel.historyOpen) {
        overlays.push(renderHistoryModal(
          frame.pageModel,
          frame.screenRect.width,
          frame.screenRect.height,
          notificationCtx,
        ));
      }

      return overlays;
    },
  });
}

export const app = createNotificationDemoApp();

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(app);
}
