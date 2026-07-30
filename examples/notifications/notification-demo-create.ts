import type { BijouContext } from '@flyingrobots/bijou';
import { stringToSurface } from '@flyingrobots/bijou';
import {
  createFramedApp,
  renderNotificationStack,
  tick,
  type FrameOverlayContext,
  type FramePage,
} from '../../packages/bijou-tui/src/index.js';
import type {
  NotificationDemoModel,
  NotificationDemoMsg,
  NotificationDemoOptions,
} from './notification-demo-contract.js';
import {
  pageKeyMap,
  renderControlsPane,
  renderLogPane,
} from './notification-demo-controls.js';
import { seedDemoNotifications } from './notification-demo-lifecycle.js';
import { applyNotificationState } from './notification-demo-overlay.js';
import { HISTORY_FILTERS, ctx } from './notification-demo-options.js';
import {
  createInitialPageModel,
  currentHistoryFilter,
} from './notification-demo-state.js';
import { updateNotificationDemo } from './notification-demo-update.js';

function createNotificationPage(
  notificationCtx: BijouContext,
  autoDemo: boolean,
): FramePage<NotificationDemoModel, NotificationDemoMsg> {
  return {
    id: 'notifications',
    title: 'Notifications',
    init() {
      const initial = createInitialPageModel();
      const seeded = autoDemo
        ? seedDemoNotifications(initial, notificationCtx)
        : initial;
      const [model, commands] = applyNotificationState(
        seeded,
        seeded.notifications,
        notificationCtx,
      );
      return [
        model,
        autoDemo ? [...commands, tick(1_600, { type: 'quit-app' })] : commands,
      ];
    },
    update: (msg, model) => updateNotificationDemo(msg, model, notificationCtx),
    keyMap: pageKeyMap,
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
            render: (width, height) =>
              stringToSurface(
                renderControlsPane(model, width, notificationCtx),
                width,
                height,
              ),
          },
          activity: {
            kind: 'pane',
            paneId: 'activity',
            render: (width, height) =>
              stringToSurface(
                renderLogPane(model, width, notificationCtx),
                width,
                height,
              ),
          },
        },
      };
    },
  };
}

function notificationOverlays(
  frame: FrameOverlayContext<NotificationDemoModel>,
  notificationCtx: BijouContext,
) {
  const paneRects = [...frame.paneRects.values()];
  const region =
    paneRects.length === 0
      ? frame.screenRect
      : {
          col: Math.min(...paneRects.map((rect) => rect.col)),
          row: Math.min(...paneRects.map((rect) => rect.row)),
          width:
            Math.max(...paneRects.map((rect) => rect.col + rect.width)) -
            Math.min(...paneRects.map((rect) => rect.col)),
          height:
            Math.max(...paneRects.map((rect) => rect.row + rect.height)) -
            Math.min(...paneRects.map((rect) => rect.row)),
        };
  return renderNotificationStack(frame.pageModel.notifications, {
    screenWidth: frame.screenRect.width,
    screenHeight: frame.screenRect.height,
    region,
    margin: 2,
    gap: 1,
    ctx: notificationCtx,
  });
}

export function createNotificationDemoApp(
  notificationCtx: BijouContext = ctx,
  options: NotificationDemoOptions = {},
) {
  const autoDemo =
    options.autoDemo ??
    (notificationCtx.runtime.env('CI') === '1' || process.env.CI === '1');
  const page = createNotificationPage(notificationCtx, autoDemo);
  return createFramedApp<NotificationDemoModel, NotificationDemoMsg>({
    title: 'Bijou Notification Lab',
    pages: [page],
    initialColumns: notificationCtx.runtime.columns,
    initialRows: notificationCtx.runtime.rows,
    keyPriority: 'page-first',
    observeKey: (msg, route) => ({
      type: 'key-observed',
      key: `${msg.ctrl ? 'ctrl+' : ''}${msg.alt ? 'alt+' : ''}${msg.shift ? 'shift+' : ''}${msg.key}`,
      route,
    }),
    enableCommandPalette: true,
    notificationCenter: ({ pageModel }) => ({
      title: 'Notification center',
      state: pageModel.notifications,
      filters: HISTORY_FILTERS,
      activeFilter: currentHistoryFilter(pageModel),
      onFilterChange: (filter) => ({ type: 'set-history-filter', filter }),
    }),
    overlayFactory: (frame) => notificationOverlays(frame, notificationCtx),
  });
}
