import {
  getDefaultContext,
  installRuntimeViewportOverlay,
  readRuntimeViewport,
  resolveClock,
  surfaceToString,
} from '@flyingrobots/bijou';
import { installBCSSResolver } from './css/install.js';
import { normalizeViewOutput } from './view-output.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import { createRuntimeBus } from './runtime-bus.js';
import type { RuntimeLifecycleHooks } from './runtime-contract.js';
import { enterRuntimeCrashMode } from './runtime-crash.js';
import { createRuntimeHost } from './runtime-host.js';
import { installRuntimeInput } from './runtime-input.js';
import { createRuntimeRenderer } from './runtime-render.js';
import { finalizeRuntime } from './runtime-shutdown.js';
import {
  createRuntimeSession,
  synchronizeInitialViewport,
} from './runtime-startup.js';
import type { App, RunOptions, RuntimeIssue } from './types.js';

export async function run<Model, M>(
  app: App<Model, M>,
  options?: RunOptions<M>,
): Promise<void> {
  await runWithLifecycleHooks(app, options, app.runtimeHooks?.(options?.ctx ?? getDefaultContext()));
}

export async function runWithLifecycleHooks<Model, M>(
  app: App<Model, M>,
  options?: RunOptions<M>,
  hooks?: RuntimeLifecycleHooks<Model>,
): Promise<void> {
  const ctx = options?.ctx ?? getDefaultContext();
  const clock = resolveClock(ctx);
  installRuntimeViewportOverlay(ctx);
  installBCSSResolver(ctx, options?.css);
  const viewport = () => readRuntimeViewport(ctx.runtime);
  const [initialModel, initCommands] = app.init();
  if (ctx.mode !== 'interactive') {
    const size = viewport();
    const normalized = normalizeViewOutput(app.view(initialModel), {
      width: size.columns,
      height: size.rows,
    });
    ctx.io.write(surfaceToString(normalized.surface, ctx.style));
    return;
  }
  const session = createRuntimeSession(initialModel);
  const initialSize = viewport();
  const buffers = new RuntimeFramebuffers(
    initialSize.columns,
    initialSize.rows,
  );
  const shutdown = (error?: unknown): void => {
    if (error !== undefined && session.fatalError === null) {
      session.fatalError = error;
    }
    if (!session.running) return;
    session.running = false;
    session.resolveQuit?.();
  };
  const routeIssue = (issue: RuntimeIssue): void => {
    const routed = app.routeRuntimeIssue?.(issue);
    if (routed !== undefined) bus.emit(routed);
  };
  const bus = createRuntimeBus(options, clock, ctx, routeIssue);
  const host = createRuntimeHost(ctx, options);
  const crash = (
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ): void => {
    enterRuntimeCrashMode(
      phase,
      error,
      snapshot,
      session,
      buffers,
      ctx,
      bus,
      viewport,
      shutdown,
      host,
    );
  };
  const renderer = createRuntimeRenderer({
    app,
    options,
    hooks,
    ctx,
    clock,
    bus,
    session,
    runtimeViewport: viewport,
    routeRuntimeIssue: routeIssue,
    crash,
  }, buffers);
  options?.middlewares?.forEach((middleware) => bus.use(middleware));
  host.enter();
  bus.connectIO(ctx.io, { mouse: host.useMouse });
  bus.onQuit(shutdown);
  bus.startPulse(ctx.runtime.refreshRate);
  const execute = installRuntimeInput(
    app,
    bus,
    ctx,
    clock,
    session,
    buffers,
    renderer,
    crash,
    shutdown,
    host,
  );
  const resizeCommands = synchronizeInitialViewport(
    app,
    session,
    viewport,
    buffers,
    crash,
  );
  if (!session.crashMode) {
    renderer.render();
    execute(initCommands);
    execute(resizeCommands);
  }
  await new Promise<void>((resolve) => {
    session.resolveQuit = resolve;
    if (!session.running) resolve();
  });
  await finalizeRuntime(session, renderer, bus, clock, ctx, host);
}
