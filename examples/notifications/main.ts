import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import {
  activateFocusedNotification,
  createFramedApp,
  createKeyMap,
  createNotificationState,
  cycleNotificationFocus,
  dismissFocusedNotification,
  dismissNotification,
  notificationsNeedTick,
  pushNotification,
  relocateNotifications,
  quit,
  renderNotificationStack,
  run,
  tick,
  tickNotifications,
  trimNotificationsToViewport,
  type Cmd,
  type FramePage,
  type NotificationPlacement,
  type NotificationSpec,
  type NotificationState,
  type NotificationTone,
  type NotificationVariant,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

const NOTIFICATION_TICK_MS = 40;
const AUTO_DEMO = ctx.runtime.env.CI === '1' || process.env.CI === '1';

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

const DURATION_OPTIONS = [
  { label: 'default', value: undefined },
  { label: 'persistent', value: null },
  { label: '2.5s', value: 2_500 },
  { label: '5.0s', value: 5_000 },
  { label: '9.0s', value: 9_000 },
] as const;

type Msg =
  | { type: 'spawn-notification' }
  | { type: 'cycle-variant' }
  | { type: 'cycle-tone' }
  | { type: 'cycle-placement' }
  | { type: 'cycle-duration' }
  | { type: 'toggle-action' }
  | { type: 'toggle-wrap' }
  | { type: 'focus-next' }
  | { type: 'focus-prev' }
  | { type: 'activate-focused' }
  | { type: 'dismiss-notification' }
  | { type: 'notification-tick' }
  | { type: 'quit-app' }
  | { type: 'notification-action'; ordinal: number };

interface PageModel {
  readonly notifications: NotificationState<Msg>;
  readonly notificationLoopActive: boolean;
  readonly variantIndex: number;
  readonly toneIndex: number;
  readonly placementIndex: number;
  readonly durationIndex: number;
  readonly actionEnabled: boolean;
  readonly wrapText: boolean;
  readonly nextOrdinal: number;
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
    nextOrdinal: 1,
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

function applyNotificationState(
  model: PageModel,
  notifications: NotificationState<Msg>,
  commands: readonly Cmd<Msg>[] = [],
  forceTick = false,
): [PageModel, Cmd<Msg>[]] {
  const trimmed = trimNotificationsToViewport(notifications, {
    screenWidth: ctx.runtime.columns,
    screenHeight: Math.max(0, ctx.runtime.rows - 2),
    margin: 2,
    gap: 1,
    ctx,
  }, ctx.clock.now());
  const needsTick = notificationsNeedTick(trimmed);
  const nextModel: PageModel = {
    ...model,
    notifications: trimmed,
    notificationLoopActive: needsTick,
  };
  const shouldScheduleTick = needsTick && (forceTick || !model.notificationLoopActive);

  return [
    nextModel,
    shouldScheduleTick
      ? [...commands, tick(NOTIFICATION_TICK_MS, { type: 'notification-tick' })]
      : [...commands],
  ];
}

function spawnConfiguredNotification(model: PageModel): [PageModel, Cmd<Msg>[]] {
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

  const notifications = pushNotification(model.notifications, spec, ctx.clock.now());
  const nextModel = appendLog({
    ...model,
    notifications,
    nextOrdinal: ordinal + 1,
  }, `Spawned ${variant} #${ordinal} at ${placement} (${formatDurationLabel(duration.value)})`);

  return applyNotificationState(nextModel, notifications);
}

function dismissCurrentNotification(model: PageModel): [PageModel, Cmd<Msg>[]] {
  const nowMs = ctx.clock.now();
  const latest = model.notifications.items.at(-1);
  const notifications = model.notifications.focusedId != null
    ? dismissFocusedNotification(model.notifications, nowMs)
    : (latest == null ? model.notifications : dismissNotification(model.notifications, latest.id, nowMs));

  if (notifications === model.notifications) return [model, []];

  const nextModel = appendLog({
    ...model,
    notifications,
  }, 'Dismissed a notification.');

  return applyNotificationState(nextModel, notifications);
}

function seedDemoNotifications(model: PageModel): PageModel {
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
  let nowMs = ctx.clock.now();

  for (const entry of entries) {
    const ordinal = next.nextOrdinal;
    const notifications = pushNotification(next.notifications, {
      title: `${entry.title} #${ordinal}`,
      message: entry.message,
      variant: entry.variant,
      tone: entry.tone,
      placement: entry.placement,
      durationMs: entry.durationMs,
      action: entry.actionLabel == null
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

function renderControlsPane(model: PageModel, width: number): string {
  const activeVariant = currentVariant(model);
  const activeTone = currentTone(model);
  const activePlacement = currentPlacement(model);
  const activeDuration = currentDuration(model);
  const focused = model.notifications.focusedId == null
    ? 'none'
    : `#${model.notifications.focusedId}`;
  const lines = [
    'Notification Lab',
    '',
    `Variant : ${activeVariant}`,
    `Tone    : ${activeTone}`,
    `Place   : ${activePlacement}`,
    `Stay    : ${activeDuration.label}`,
    `Action  : ${model.actionEnabled ? 'enabled' : 'disabled'}`,
    `Wrap    : ${model.wrapText ? 'enabled' : 'disabled'}`,
    `Stack   : ${model.notifications.items.length}`,
    `History : ${model.notifications.history.length}`,
    `Focus   : ${focused}`,
    '',
    `${kbd('n')} spawn`,
    `${kbd('v')} cycle variant`,
    `${kbd('t')} cycle tone`,
    `${kbd('l')} cycle placement`,
    `${kbd('d')} cycle duration`,
    `${kbd('a')} toggle action`,
    `${kbd('w')} toggle wrap`,
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
    ctx,
  });
}

function renderLogPane(model: PageModel, width: number): string {
  const lines = [
    'Recent events',
    '',
    ...model.log,
  ];

  return box(lines.join('\n'), {
    width,
    title: 'Activity',
    overflow: model.wrapText ? 'wrap' : 'truncate',
    ctx,
  });
}

const page: FramePage<PageModel, Msg> = {
  id: 'notifications',
  title: 'Notifications',
  init() {
    const seeded = AUTO_DEMO ? seedDemoNotifications(createInitialPageModel()) : createInitialPageModel();
    const [model, cmds] = applyNotificationState(seeded, seeded.notifications);
    return [
      model,
      AUTO_DEMO ? [...cmds, tick(1_600, { type: 'quit-app' })] : cmds,
    ];
  },
  update(msg, model) {
    switch (msg.type) {
      case 'spawn-notification':
        return spawnConfiguredNotification(model);
      case 'cycle-variant':
        return [{
          ...model,
          variantIndex: (model.variantIndex + 1) % VARIANTS.length,
        }, []];
      case 'cycle-tone':
        return [{
          ...model,
          toneIndex: (model.toneIndex + 1) % TONES.length,
        }, []];
      case 'cycle-placement':
      {
        const nextPlacementIndex = (model.placementIndex + 1) % PLACEMENTS.length;
        const nextPlacement = PLACEMENTS[nextPlacementIndex]!;
        const notifications = relocateNotifications(
          model.notifications,
          nextPlacement,
          ctx.clock.now(),
        );
        const nextModel = appendLog({
          ...model,
          placementIndex: nextPlacementIndex,
          notifications,
        }, `Moved active notifications to ${nextPlacement}.`);
        return applyNotificationState(nextModel, notifications);
      }
      case 'cycle-duration':
        return [{
          ...model,
          durationIndex: (model.durationIndex + 1) % DURATION_OPTIONS.length,
        }, []];
      case 'toggle-action':
        return [{
          ...model,
          actionEnabled: !model.actionEnabled,
        }, []];
      case 'toggle-wrap':
        return [{
          ...model,
          wrapText: !model.wrapText,
        }, []];
      case 'focus-next':
        return [{
          ...model,
          notifications: cycleNotificationFocus(model.notifications, 1),
        }, []];
      case 'focus-prev':
        return [{
          ...model,
          notifications: cycleNotificationFocus(model.notifications, -1),
        }, []];
      case 'dismiss-notification':
        return dismissCurrentNotification(model);
      case 'activate-focused': {
        const result = activateFocusedNotification(model.notifications, ctx.clock.now());
        let nextModel = {
          ...model,
          notifications: result.state,
        };

        if (result.payload?.type === 'notification-action') {
          nextModel = appendLog(nextModel, `Action fired from notification #${result.payload.ordinal}.`);
        }

        return applyNotificationState(nextModel, nextModel.notifications);
      }
      case 'notification-action':
        return [appendLog(model, `Notification #${msg.ordinal} delivered its action payload.`), []];
      case 'notification-tick': {
        const notifications = tickNotifications(model.notifications, ctx.clock.now());
        return applyNotificationState({
          ...model,
          notifications,
        }, notifications, [], true);
      }
      case 'quit-app':
        return [model, [quit()]];
      default:
        return [model, []];
    }
  },
  keyMap: createKeyMap<Msg>()
    .bind('n', 'Spawn notification', { type: 'spawn-notification' })
    .bind('v', 'Cycle variant', { type: 'cycle-variant' })
    .bind('t', 'Cycle tone', { type: 'cycle-tone' })
    .bind('l', 'Cycle placement', { type: 'cycle-placement' })
    .bind('d', 'Cycle duration', { type: 'cycle-duration' })
    .bind('a', 'Toggle action button', { type: 'toggle-action' })
    .bind('w', 'Toggle text wrap', { type: 'toggle-wrap' })
    .bind('j', 'Focus next actionable notification', { type: 'focus-next' })
    .bind('k', 'Focus previous actionable notification', { type: 'focus-prev' })
    .bind('enter', 'Run focused notification action', { type: 'activate-focused' })
    .bind('x', 'Dismiss focused/latest notification', { type: 'dismiss-notification' })
    .bind('q', 'Quit demo', { type: 'quit-app' }),
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
          render: (width) => renderControlsPane(model, width),
        },
        activity: {
          kind: 'pane',
          paneId: 'activity',
          render: (width) => renderLogPane(model, width),
        },
      },
    };
  },
};

const app = createFramedApp<PageModel, Msg>({
  title: 'Bijou Notification Lab',
  pages: [page],
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

    return renderNotificationStack(frame.pageModel.notifications, {
      screenWidth: frame.screenRect.width,
      screenHeight: frame.screenRect.height,
      region,
      margin: 2,
      gap: 1,
      ctx,
    });
  },
});

run(app);
