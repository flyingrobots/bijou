import { run, type App, type RunOptions } from '@flyingrobots/bijou-tui';
import { createNodeContext } from './node-context.js';
import type { CreateNodeContextOptions } from './options.js';
import { initDefaultContext, registerInitializedNodeContext } from './node-default-context.js';

/** Options for {@link startApp}. */
export type StartAppOptions<M = unknown> = RunOptions<M> & CreateNodeContextOptions;

interface SelfRunningApp<M = unknown> {
  run(options?: RunOptions<M>): Promise<void>;
}

function isSelfRunningApp<M>(app: App<unknown, M>): app is App<unknown, M> & SelfRunningApp<M> {
  return 'run' in app && typeof app.run === 'function';
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
    io: ioOverride,
    nodeIO: nodeIOOptions,
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
      || ioOverride !== undefined
      || nodeIOOptions !== undefined
    ) {
      ctx = createNodeContext({
        theme,
        presets,
        envVar,
        themes,
        themeMode,
        themeOverride,
        io: ioOverride,
        nodeIO: nodeIOOptions,
      });
      registerInitializedNodeContext(ctx);
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
