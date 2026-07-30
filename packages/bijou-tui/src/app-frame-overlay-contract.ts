import type {
  PreparedPreferenceSection,
  ResolvedTheme,
  Surface,
} from '@flyingrobots/bijou';
import type {
  FrameSettingRow,
  FrameSettings,
  FrameShellTheme,
  FrameShellThemeSpec,
} from './app-frame.js';
import type {
  NotificationHistoryFilter,
  NotificationState,
} from './notification.js';

export const FRAME_SHELL_THEME_ROW_ID = '__frame-shell-theme__';

export type SettingsRowBehavior = 'cycle-shell-theme';

export interface ResolvedFrameShellTheme {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly shellTheme: FrameShellTheme;
  readonly shellThemeSpec: FrameShellThemeSpec;
  readonly shellThemeId: string;
  readonly shellThemeLabel: string;
  readonly modeId?: string;
  readonly modeLabel?: string;
  readonly resolvedTheme: ResolvedTheme;
}

export interface FlatSettingsRow<Msg> {
  readonly index: number;
  readonly line: number;
  readonly height: number;
  readonly row: FrameSettingRow<Msg>;
  readonly behavior?: SettingsRowBehavior;
}

export interface ResolvedSettingsLayout<Msg> {
  readonly settings: FrameSettings<Msg>;
  readonly preferenceSections: readonly PreparedPreferenceSection[];
  readonly rows: readonly FlatSettingsRow<Msg>[];
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly totalLines: number;
  readonly maxScrollY: number;
}

export interface ResolvedFrameNotificationCenter<Msg> {
  readonly title: string;
  readonly state: NotificationState<Msg>;
  readonly filters: readonly NotificationHistoryFilter[];
  readonly activeFilter: NotificationHistoryFilter;
  readonly onFilterChange?: (
    filter: NotificationHistoryFilter,
  ) => Msg | undefined;
}

export interface ResolvedNotificationCenterLayout<Msg> {
  readonly center: ResolvedFrameNotificationCenter<Msg>;
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly content: Surface;
  readonly maxScrollY: number;
}

export const DEFAULT_NOTIFICATION_CENTER_FILTERS: readonly NotificationHistoryFilter[] =
  ['ALL', 'ACTIONABLE', 'ERROR', 'WARNING', 'SUCCESS', 'INFO'];
