import type { BijouContext } from '@flyingrobots/bijou';
import { resolveSafeCtx, setDefaultContext, setDefaultContextInitializer } from '@flyingrobots/bijou';
import { createNodeContext } from './node-context.js';
import type { InitDefaultContextOptions } from './options.js';
import { BijouBootstrapError } from './bootstrap-error.js';

/** Test-only helper that restores the Node ambient-context initializer after resets. */
export function _registerDefaultContextInitializerForTesting(): void {
  setDefaultContextInitializer(() => createNodeContext());
}

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
 * and registers it with `setDefaultContext` for ambient `ctx` use.
 *
 * Subsequent calls return a fresh (unregistered) context without
 * overwriting the global default.
 *
 * @returns The {@link BijouContext} created during initialization, or a
 *   fresh context on subsequent calls.
 */
export function initDefaultContext(options: InitDefaultContextOptions = {}): BijouContext {
  const stdoutColumns = process.stdout.columns;
  const stdoutRows = process.stdout.rows;
  if (stdoutColumns === 0 || stdoutRows === 0) {
    throw new BijouBootstrapError(
      'stdout reported zero columns/rows',
      'stdout is not a TTY — use pipe mode or redirect to a file, or run in a real terminal.',
    );
  }

  try {
    const hasExplicitOptions =
      options.theme !== undefined
      || options.presets !== undefined
      || options.envVar !== undefined
      || options.themes !== undefined
      || options.themeMode !== undefined
      || options.themeOverride !== undefined || options.io !== undefined || options.nodeIO !== undefined;
    if (!initialized && !hasExplicitOptions) {
      const existing = resolveSafeCtx();
      if (existing != null) {
        initialized = true;
        return existing;
      }
    }
    if (!initialized) {
      const ctx = createNodeContext(options);
      registerInitializedNodeContext(ctx);
      return ctx;
    }
    return createNodeContext(options);
  } catch (error) {
    if (error instanceof BijouBootstrapError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const reason = `Could not initialize Node host context: ${message}`;
    const hint =
      message.includes('setRawMode')
        ? 'raw mode unavailable — run in an interactive terminal rather than a non-TTY pipeline.'
        : 'check the active terminal environment and rerun, or start in a supported TTY context.';

    throw new BijouBootstrapError(reason, hint, error);
  }
}

/** Register a context and retain the Node host's once-only initialization state. */
export function registerInitializedNodeContext(ctx: BijouContext): void {
  setDefaultContext(ctx);
  initialized = true;
}
