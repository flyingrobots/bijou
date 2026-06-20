import type { ColorScheme, IOPort, Theme } from '@flyingrobots/bijou';
import type { NodeIOOptions } from './io-types.js';

/** Theme-selection options for Node-hosted context creation. */
export interface NodeThemeEntry {
  /** Stable selection id for env/config or app-owned override state. */
  readonly id: string;
  /** Theme value associated with this entry. */
  readonly theme: Theme;
  /**
   * Optional light/dark hint used by automatic selection.
   *
   * When omitted, `id === "light"` and `id === "dark"` are treated as the
   * corresponding scheme.
   */
  readonly scheme?: ColorScheme;
}

/** Host-level theme mode for automatic selection. */
export type NodeThemeMode = 'auto' | ColorScheme;

/** Theme-selection options for Node-hosted context creation. */
export interface NodeThemeOptions {
  /**
   * Explicit fallback theme object to use for this host context.
   *
   * This wins whenever the selected env var does not point at a known preset or
   * a valid DTCG JSON file.
   */
  theme?: Theme;
  /** Named preset themes available to env-var selection. */
  presets?: Record<string, Theme>;
  /** Environment variable name that selects a preset or JSON theme path. */
  envVar?: string;
  /** Named theme entries available for auto-selection or app-owned overrides. */
  themes?: readonly NodeThemeEntry[];
  /** Automatic or forced light/dark selection mode for `themes`. */
  themeMode?: NodeThemeMode;
  /** Explicit theme-entry id override that wins over env-driven selection. */
  themeOverride?: string;
}

/** Options for `createNodeContext`. */
export interface CreateNodeContextOptions extends NodeThemeOptions {
  /** Optional IO adapter override for tests or embedded hosts. */
  readonly io?: IOPort;
  /** Optional Node IO construction overrides when `io` is omitted. */
  readonly nodeIO?: NodeIOOptions;
}

/** Options for `initDefaultContext`. */
export type InitDefaultContextOptions = CreateNodeContextOptions;
