import type {
  Cmd,
  MouseMsg,
  NotificationHistoryFilter,
  NotificationState,
} from '../../packages/bijou-tui/src/index.js';

export type NotificationDemoMsg =
  | MouseMsg
  | { type: 'spawn-notification' }
  | { type: 'cycle-variant' }
  | { type: 'cycle-tone' }
  | { type: 'cycle-placement' }
  | { type: 'cycle-duration' }
  | { type: 'toggle-action' }
  | { type: 'toggle-wrap' }
  | {
      type: 'set-history-filter';
      filter: NotificationHistoryFilter;
    }
  | { type: 'focus-next' }
  | { type: 'focus-prev' }
  | { type: 'activate-focused' }
  | { type: 'dismiss-notification' }
  | { type: 'notification-tick' }
  | {
      type: 'key-observed';
      key: string;
      route: string;
    }
  | { type: 'quit-app' }
  | {
      type: 'notification-action';
      ordinal: number;
    };

export interface NotificationDemoModel {
  readonly notifications: NotificationState<NotificationDemoMsg>;
  readonly notificationLoopActive: boolean;
  readonly variantIndex: number;
  readonly toneIndex: number;
  readonly placementIndex: number;
  readonly durationIndex: number;
  readonly actionEnabled: boolean;
  readonly wrapText: boolean;
  readonly historyFilterIndex: number;
  readonly nextOrdinal: number;
  readonly lastHandledInput: string;
  readonly log: readonly string[];
}

export interface NotificationDemoOptions {
  readonly autoDemo?: boolean;
}

export type NotificationDemoUpdate = [
  NotificationDemoModel,
  Cmd<NotificationDemoMsg>[],
];
