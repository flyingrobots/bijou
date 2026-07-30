import type {
  PreferenceListTheme,
  TokenValue,
} from '@flyingrobots/bijou';
import type {
  NotificationHistoryFilter,
  NotificationState,
  NotificationTone,
} from './notification.js';

/** A single declarative settings row rendered by the frame shell. */
export interface FrameSettingRow<Msg> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly valueLabel?: string;
  readonly checked?: boolean;
  readonly action?: Msg;
  readonly feedback?: FrameSettingFeedback;
  readonly kind?: 'action' | 'toggle' | 'choice' | 'info';
  readonly enabled?: boolean;
}

/** Shell-owned feedback shown after a settings row is activated. */
export interface FrameSettingFeedback {
  readonly title?: string;
  readonly message: string;
  readonly tone?: NotificationTone;
  readonly durationMs?: number | null;
}

/** A titled section inside the frame-owned settings drawer. */
export interface FrameSettingSection<Msg> {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly FrameSettingRow<Msg>[];
}

/** Structured settings content supplied by the app and rendered by the frame shell. */
export interface FrameSettings<Msg> {
  readonly title?: string;
  readonly borderToken?: TokenValue;
  readonly bgToken?: TokenValue;
  readonly listTheme?: PreferenceListTheme;
  readonly sections: readonly FrameSettingSection<Msg>[];
}

/** Structured notification review content supplied by the app and rendered by the frame shell. */
export interface FrameNotificationCenter<Msg> {
  readonly title?: string;
  readonly state: NotificationState<Msg>;
  readonly filters?: readonly NotificationHistoryFilter[];
  readonly activeFilter?: NotificationHistoryFilter;
  readonly onFilterChange?: (
    filter: NotificationHistoryFilter,
  ) => Msg | undefined;
}
