import type { BijouContext, Theme, TokenValue } from '@flyingrobots/bijou';

/** Optional styling overrides for the frame-owned header line. */
export interface FrameHeaderStyle {
  /** Foreground token for the active tab/page label in the header. */
  readonly activeTabToken?: TokenValue;
}

/** One concrete mode inside a mode-aware shell theme family. */
export interface FrameShellThemeMode {
  /** Stable mode id within the shell theme family. */
  readonly id: string;
  /** Visible mode label shown in the settings drawer. */
  readonly label: string;
  /** Concrete theme payload applied when this mode is selected. */
  readonly theme: Theme;
  /** Optional helper copy shown beneath the row when active. */
  readonly description?: string;
}

/** Stable values for shell theme mode siblings. */
export const FRAME_SHELL_THEME_MODE_SUPPORT = Object.freeze({
  single: 'single',
  paired: 'paired',
} as const);

/** Declares whether a first-party shell theme has mode siblings. */
export type FrameShellThemeModeSupport =
  (typeof FRAME_SHELL_THEME_MODE_SUPPORT)[keyof typeof FRAME_SHELL_THEME_MODE_SUPPORT];

/** Concrete shell-theme option surfaced in settings. */
export interface FrameShellTheme {
  /** Stable option id. */
  readonly id: string;
  /** Visible label shown in the settings drawer. */
  readonly label: string;
  /** Theme payload applied when this option is selected. */
  readonly theme: Theme;
  /** Concrete shell themes are single-mode unless a family provides modes. */
  readonly modeSupport?: typeof FRAME_SHELL_THEME_MODE_SUPPORT.single;
  /** Mode-aware shell theme families use FrameShellThemeFamily instead. */
  readonly modes?: never;
  /** Optional helper copy shown beneath the row when active. */
  readonly description?: string;
}

/** Shell-theme family with selectable modes. */
export interface FrameShellThemeFamily {
  /** Stable shell theme family id. */
  readonly id: string;
  /** Visible family label shown in the settings drawer. */
  readonly label: string;
  /** Concrete modes exposed as settings choices. */
  readonly modes: readonly FrameShellThemeMode[];
  /** Mode-aware shell theme families provide paired or otherwise sibling modes. */
  readonly modeSupport?: typeof FRAME_SHELL_THEME_MODE_SUPPORT.paired;
  /** Concrete single-theme entries use FrameShellTheme instead. */
  readonly theme?: never;
  /** Optional helper copy shown beneath the row when active. */
  readonly description?: string;
}

/** A stock shell-theme spec, either one concrete theme or one mode-aware family. */
export type FrameShellThemeSpec = FrameShellTheme | FrameShellThemeFamily;

/** Notification payload emitted when the stock frame shell theme changes. */
export interface FrameShellThemeChange {
  /** Selected concrete shell theme choice. */
  readonly shellTheme: FrameShellTheme;
  /** Original stock shell theme spec that produced the selected choice. */
  readonly shellThemeSpec: FrameShellThemeSpec;
  /** Selected shell theme family id. */
  readonly shellThemeId: string;
  /** Selected shell theme family label. */
  readonly shellThemeLabel: string;
  /** Selected shell theme mode id, when the family is mode-aware. */
  readonly modeId?: string;
  /** Selected shell theme mode label, when the family is mode-aware. */
  readonly modeLabel?: string;
  /** Fresh context cloned with the selected theme. */
  readonly ctx: BijouContext;
}
