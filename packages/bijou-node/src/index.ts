/**
 * Node.js adapter package for bijou.
 *
 * Re-exports the individual port adapters ({@link nodeRuntime},
 * {@link nodeIO}, {@link chalkStyle}) and provides convenience
 * functions for constructing a fully-wired {@link BijouContext}
 * bound to the current Node.js process.
 *
 * @packageDocumentation
 */

import type { BijouContext, Theme, ColorScheme } from '@flyingrobots/bijou';
import {
  createBijou,
  detectColorScheme,
  resolveSafeCtx,
  setDefaultContext,
  setDefaultContextInitializer,
} from '@flyingrobots/bijou';
import { run, type App, type RunOptions } from '@flyingrobots/bijou-tui';
import { nodeRuntime } from './runtime.js';
import { nodeIO } from './io.js';
import { chalkStyle } from './style.js';

/** Re-export the Node.js {@link RuntimePort} factory. */
export { nodeRuntime, detectRefreshRate } from './runtime.js';
/** Re-export the Node.js {@link IOPort} factory. */
export {
  nodeIO,
  scopedNodeIO,
  ScopedNodeIOError,
  type ScopedNodeIO,
  type ScopedNodeIOOptions,
} from './io.js';
/** Re-export the Chalk-based {@link StylePort} factory and its options type. */
export { chalkStyle, type ChalkStyleOptions } from './style.js';

/** Re-export Worker utilities for multi-threaded applications. */
export { isBijouWorker, runInWorker, sendToMain, startWorkerApp, type RunWorkerOptions } from './worker/worker.js';
export {
  recordDemoGif,
  rasterizeSurface,
  writeSurfaceGif,
  type NativeDemoSpec,
  type RecorderResult,
  type SurfaceGifOptions,
} from './recorder.js';

const DISABLED_THEME_ENV_VAR = '__BIJOU_THEME_DISABLED__';

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

/** Options for {@link createNodeContext}. */
export type CreateNodeContextOptions = NodeThemeOptions;

/** Options for {@link initDefaultContext}. */
export type InitDefaultContextOptions = NodeThemeOptions;

/** Options for {@link startApp}. */
export type StartAppOptions<M = any> = RunOptions<M> & NodeThemeOptions;

interface SelfRunningApp<M = unknown> {
  run(options?: RunOptions<M>): Promise<void>;
}

function isSelfRunningApp<M>(app: App<unknown, M>): app is App<unknown, M> & SelfRunningApp<M> {
  return typeof (app as unknown as SelfRunningApp<M>).run === 'function';
}

function inferThemeEntryScheme(entry: NodeThemeEntry): ColorScheme | undefined {
  if (entry.scheme !== undefined) return entry.scheme;
  if (entry.id === 'light' || entry.id === 'dark') return entry.id;
  return undefined;
}

function mergeNodeThemePresets(options: NodeThemeOptions): Record<string, Theme> | undefined {
  if (options.themes === undefined || options.themes.length === 0) {
    return options.presets;
  }
  const merged: Record<string, Theme> = { ...(options.presets ?? {}) };
  for (const entry of options.themes) {
    merged[entry.id] = entry.theme;
  }
  return merged;
}

function resolveExplicitThemeOverride(options: NodeThemeOptions): Theme | undefined {
  if (options.themeOverride === undefined) return undefined;
  const match = options.themes?.find((entry) => entry.id === options.themeOverride);
  return match?.theme;
}

function resolveAutomaticTheme(runtime: ReturnType<typeof nodeRuntime>, options: NodeThemeOptions): Theme | undefined {
  if (options.themes === undefined || options.themes.length === 0) {
    return options.theme;
  }

  const mode = options.themeMode ?? 'auto';
  const targetScheme = mode === 'auto' ? detectColorScheme(runtime) : mode;
  const byScheme = options.themes.find((entry) => inferThemeEntryScheme(entry) === targetScheme);
  if (byScheme !== undefined) return byScheme.theme;

  const byId = options.themes.find((entry) => entry.id === targetScheme);
  if (byId !== undefined) return byId.theme;

  return options.themes[0]?.theme ?? options.theme;
}

/** Test-only helper that restores the Node ambient-context initializer after resets. */
export function _registerDefaultContextInitializerForTesting(): void {
  setDefaultContextInitializer(() => createNodeContext());
}

/**
 * Create a {@link BijouContext} wired to Node.js adapters.
 *
 * Assembles {@link nodeRuntime}, {@link nodeIO}, and {@link chalkStyle}
 * into a single context via `createBijou`. Automatically respects the
 * `NO_COLOR` environment variable by passing it through to the style
 * adapter.
 *
 * @returns A fresh {@link BijouContext} backed by the current Node.js process.
 */
export function createNodeContext(options: CreateNodeContextOptions = {}): BijouContext {
  const runtime = nodeRuntime();
  const noColor = runtime.env('NO_COLOR') !== undefined;
  const explicitOverrideTheme = resolveExplicitThemeOverride(options);
  const fallbackTheme = explicitOverrideTheme ?? resolveAutomaticTheme(runtime, options);
  const envVar = explicitOverrideTheme !== undefined ? DISABLED_THEME_ENV_VAR : options.envVar;
  const presets = mergeNodeThemePresets(options);
  // Force level 3 (truecolor) if NO_COLOR is not set, 
  // as the user is explicitly requesting a rich dashboard experience.
  return createBijou({
    runtime,
    io: nodeIO(),
    style: chalkStyle({ noColor, level: noColor ? 0 : 3 }),
    theme: fallbackTheme,
    presets,
    envVar,
  });
}

_registerDefaultContextInitializerForTesting();

/**
 * Guard flag ensuring {@link initDefaultContext} only registers the global
 * default context once per process lifetime.
 */
let initialized = false;

/**
 * Reset the initialization guard.
 *
 * **Test-only** -- allows test suites to re-trigger
 * {@link initDefaultContext}'s first-call behavior.
 */
export function _resetInitializedForTesting(): void {
  initialized = false;
}

/**
 * Initialize and register the global default {@link BijouContext}.
 *
 * On the first call, creates a Node.js context via {@link createNodeContext}
 * and registers it with `setDefaultContext` so that bijou components
 * omitting the optional `ctx` parameter automatically use it.
 *
 * Subsequent calls return a fresh (unregistered) context without
 * overwriting the global default.
 *
 * @returns The {@link BijouContext} created during initialization, or a
 *   fresh context on subsequent calls.
 */
export function initDefaultContext(options: InitDefaultContextOptions = {}): BijouContext {
  const hasExplicitThemeSelection =
    options.theme !== undefined
    || options.presets !== undefined
    || options.envVar !== undefined
    || options.themes !== undefined
    || options.themeMode !== undefined
    || options.themeOverride !== undefined;
  if (!initialized && !hasExplicitThemeSelection) {
    const existing = resolveSafeCtx();
    if (existing != null) {
      initialized = true;
      return existing;
    }
  }
  if (!initialized) {
    const ctx = createNodeContext(options);
    setDefaultContext(ctx);
    initialized = true;
    return ctx;
  }
  return createNodeContext(options);
}

/**
 * Start a Bijou TUI app on the current Node.js host.
 *
 * This is the first-app convenience path for Node hosts. When no context is
 * provided, it initializes and registers the default Node context so apps that
 * rely on ambient `ctx` resolution still behave correctly. Callers that need
 * explicit ownership can pass `options.ctx` directly. Self-running framed apps
 * are delegated to their hosted runner instead of being forced through raw
 * `run(app, ...)`.
 *
 * @param app - The TEA application to run.
 * @param options - Runtime options forwarded to {@link run}.
 */
export async function startApp<Model, M>(
  app: App<Model, M>,
  options?: StartAppOptions<M>,
): Promise<void> {
  const {
    ctx: explicitCtx,
    theme,
    presets,
    envVar,
    themes,
    themeMode,
    themeOverride,
    ...runOptions
  } = options ?? {};
  let ctx = explicitCtx;
  if (!ctx) {
    if (
      theme !== undefined
      || presets !== undefined
      || envVar !== undefined
      || themes !== undefined
      || themeMode !== undefined
      || themeOverride !== undefined
    ) {
      ctx = createNodeContext({ theme, presets, envVar, themes, themeMode, themeOverride });
      setDefaultContext(ctx);
      initialized = true;
    } else {
      ctx = initDefaultContext();
    }
  }
  if (isSelfRunningApp(app)) {
    await app.run({ ...runOptions, ctx });
    return;
  }
  await run(app, { ...runOptions, ctx });
}
