import { getDefaultContext, createSurface, surfaceToString, resolveClock } from '@flyingrobots/bijou';
import type { RuntimePort, WritePort, Surface, TimerHandle } from '@flyingrobots/bijou';
import type { App, Cmd, RunOptions, ResizeMsg } from './types.js';
import { isKeyMsg, isPulseMsg, isResizeMsg } from './types.js';
import { clearAndHome, enterScreen, exitScreen, renderSurfaceFrame } from './screen.js';
import { createEventBus } from './eventbus.js';
import { createPipeline, type RenderState } from './pipeline/pipeline.js';
import { bcssMiddleware } from './pipeline/middleware/css.js';
import { motionMiddleware } from './pipeline/middleware/motion.js';
import { paintMiddleware } from './pipeline/middleware/paint.js';
import { installBCSSResolver } from './css/install.js';
import { normalizeViewOutput, wrapViewOutputAsLayoutRoot } from './view-output.js';

/**
 * Disable mouse reporting sequences that terminals may send.
 * Some terminals auto-enable mouse tracking in alt screen mode.
 */
const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1006l';

/**
 * Enable SGR mouse reporting.
 * 1000 = basic press/release, 1002 = button-event tracking (drag),
 * 1006 = SGR extended format (supports large coordinates, explicit release).
 */
const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';

/**
 * Run a TEA application.
 *
 * In non-interactive modes (pipe/static/accessible), renders the initial view
 * once and exits. In interactive mode, enters the alt screen, starts the
 * keyboard event loop, and drives the model/update/view cycle.
 *
 * All input sources (keyboard, resize, commands) are unified through an
 * internal EventBus — a single subscription drives the update cycle.
 *
 * @template Model - The application model type.
 * @template M     - The message (action) type for the TEA update cycle.
 * @param app     - The TEA application definition (init, update, view).
 * @param options - Optional runtime configuration (context, alt screen, cursor, mouse).
 * @returns A promise that resolves when the application exits.
 */
export async function run<Model, M>(
  app: App<Model, M>,
  options?: RunOptions<M>,
): Promise<void> {
  const ctx = options?.ctx ?? getDefaultContext();
  const clock = resolveClock(ctx);
  installRuntimeOverlay(ctx);
  const useAltScreen = options?.altScreen ?? true;
  const useHideCursor = options?.hideCursor ?? true;
  const useMouse = options?.mouse ?? false;
  installBCSSResolver(ctx, options?.css);

  const [initModel, initCmds] = app.init();

  // Non-interactive: render once and return
  if (ctx.mode !== 'interactive') {
    const viewOutput = app.view(initModel);
    let output: string;
    if (typeof viewOutput === 'string') {
      output = viewOutput;
    } else {
      const normalized = normalizeViewOutput(viewOutput, {
        width: sanitizeDimension(ctx.runtime.columns),
        height: sanitizeDimension(ctx.runtime.rows),
      });
      output = surfaceToString(normalized.surface, ctx.style);
    }
    ctx.io.write(output);
    return;
  }

  // Interactive mode
  let model = initModel;
  let running = true;
  let lastCtrlC: number | null = null;
  let resolveQuit: (() => void) | null = null;
  let currentDt = 0.016; // Default to 60fps for first frame
  let fatalError: unknown = null;

  // Double Buffering: track what is currently on screen
  let currentSurface: Surface = createSurface(
    sanitizeDimension(ctx.runtime.columns),
    sanitizeDimension(ctx.runtime.rows),
  );

  const bus = createEventBus<M>({
    clock,
    onCommandRejected(error) {
      const message = error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
      writeErrorLine(ctx.io, `[EventBus] Command rejected: ${message}\n`);
    },
  });

  // Setup Programmable Rendering Pipeline
  const pipeline = createPipeline();

  // 1. Layout Logic Stage
  pipeline.use('Layout', (state, next) => {
    const viewOutput = app.view(state.model);
    (state as any).layoutRoot = wrapViewOutputAsLayoutRoot(viewOutput, {
      width: sanitizeDimension(ctx.runtime.columns),
      height: sanitizeDimension(ctx.runtime.rows),
    });
    next();
  });

  // 2. Motion Interpolation Stage
  pipeline.use('Layout', motionMiddleware());

  if (options?.css) {
    pipeline.use('Layout', bcssMiddleware(options.css));
  }

  // 3. Paint Stage
  pipeline.use('Paint', paintMiddleware());

  // Add default Diff stage (double-buffering)
  pipeline.use('Diff', (state, next) => {
    renderSurfaceFrame(
      state.ctx.io,
      state.currentSurface,
      state.targetSurface,
      state.ctx.style
    );
    next();
  });

  // Add default Output stage (sync current surface)
  pipeline.use('Output', (state, next) => {
    currentSurface = state.targetSurface.clone();
    next();
  });

  options?.configurePipeline?.(pipeline);

  // Register user middleware
  if (options?.middlewares) {
    for (const mw of options.middlewares) {
      bus.use(mw);
    }
  }

  /** Tear down the run loop and signal the quit promise. */
  function shutdown(error?: unknown): void {
    if (error !== undefined && fatalError === null) {
      fatalError = error;
    }
    if (!running) return;
    running = false;
    if (resolveQuit) resolveQuit();
  }

  // Setup screen
  if (useAltScreen || useHideCursor) {
    enterScreen(ctx.io);
  }
  if (useMouse) {
    ctx.io.write(ENABLE_MOUSE);
  } else {
    ctx.io.write(DISABLE_MOUSE);
  }

  // Render helper
  let renderRequested = false;
  let renderHandle: TimerHandle | null = null;
  /** Render the current model's view to the terminal. */
  function render(): void {
    if (!running || renderRequested) return;
    renderRequested = true;

    let scheduledHandle: TimerHandle | null = null;
    scheduledHandle = clock.setTimeout(() => {
      try {
        const targetSurface = createSurface(
          sanitizeDimension(ctx.runtime.columns),
          sanitizeDimension(ctx.runtime.rows),
        );

        const renderState: RenderState = {
          model,
          ctx,
          dt: currentDt,
          currentSurface,
          targetSurface,
          layoutMap: new Map(),
          data: {},
        };

        pipeline.execute(renderState);
      } catch (error) {
        writeErrorLine(
          ctx.io,
          `[Runtime Error] ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
        );
        shutdown(error);
      } finally {
        renderRequested = false;
        scheduledHandle?.dispose();
        if (renderHandle === scheduledHandle) {
          renderHandle = null;
        }
      }
    }, 0);
    renderHandle = scheduledHandle;
  }

  // Execute commands through the bus
  /** Submit TEA commands to the event bus for async execution. */
  function executeCommands(cmds: Cmd<M>[]): void {
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  }

  // Connect I/O sources — keyboard + resize (+ mouse when enabled), parsed and unified
  bus.connectIO(ctx.io, { mouse: useMouse });

  // Handle quit signals from commands
  bus.onQuit(shutdown);

  // Start heartbeat for animations
  bus.startPulse(ctx.runtime.refreshRate);

  // Single subscription drives the entire update cycle
  bus.on((msg) => {
    if (!running) return;

    // Track time delta from pulse
    if (isPulseMsg(msg)) {
      currentDt = msg.dt;
    }

    if (isResizeMsg(msg)) {
      ctx.runtime.columns = sanitizeDimension(msg.columns);
      ctx.runtime.rows = sanitizeDimension(msg.rows);
      currentSurface = createSurface(
        ctx.runtime.columns,
        ctx.runtime.rows,
      );
      clearAndHome(ctx.io);
    }

    // Double Ctrl+C force-quit
    if (isKeyMsg(msg) && msg.key === 'c' && msg.ctrl) {
      const now = clock.now();
      if (lastCtrlC !== null && now - lastCtrlC < 1000) {
        shutdown();
        return;
      }
      lastCtrlC = now;
    }

    const [newModel, cmds] = app.update(msg, model);
    model = newModel;
    render();
    executeCommands(cmds);
  });

  // Apply an initial runtime-size sync before first render.
  // This keeps framed apps sized from ports instead of process globals.
  const initialResize: ResizeMsg = {
    type: 'resize',
    columns: sanitizeDimension(ctx.runtime.columns),
    rows: sanitizeDimension(ctx.runtime.rows),
  };
  const [resizedModel, resizeCmds] = app.update(initialResize, model);
  model = resizedModel;

  // After a potential resize in update, ensure currentSurface matches size
  // to avoid diffing mismatched grids.
  currentSurface = createSurface(
    sanitizeDimension(ctx.runtime.columns),
    sanitizeDimension(ctx.runtime.rows),
  );

  // Initial render + startup commands
  render();
  executeCommands(initCmds);
  executeCommands(resizeCmds);

  // Wait for quit signal
  await new Promise<void>((resolve) => {
    resolveQuit = resolve;
    if (!running) resolve();
  });

  // Ensure any pending render is flushed before exiting
  if (renderRequested) {
    await new Promise<void>((resolve) => {
      let flushHandle: TimerHandle | null = null;
      flushHandle = clock.setTimeout(() => {
        flushHandle?.dispose();
        flushHandle = null;
        resolve();
      }, 0);
    });
  }

  // Cleanup — bus disposes all I/O connections
  disposeTimerHandle(renderHandle);
  renderHandle = null;
  bus.stopPulse();
  bus.dispose();
  if (useMouse) {
    ctx.io.write(DISABLE_MOUSE);
  }
  if (useAltScreen || useHideCursor) {
    exitScreen(ctx.io);
  }

  if (fatalError != null) {
    throw fatalError instanceof Error ? fatalError : new Error(String(fatalError));
  }
}

function disposeTimerHandle(handle: TimerHandle | null): void {
  handle?.dispose();
}

/** Clamp a terminal dimension to a non-negative integer. */
function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function installRuntimeOverlay(ctx: { runtime: RuntimePort }): RuntimePort {
  const baseRuntime = ctx.runtime;
  const state = {
    columns: sanitizeDimension(baseRuntime.columns),
    rows: sanitizeDimension(baseRuntime.rows),
  };
  const runtime: RuntimePort = {
    env(key: string): string | undefined {
      return baseRuntime.env(key);
    },
    get stdoutIsTTY(): boolean {
      return baseRuntime.stdoutIsTTY;
    },
    get stdinIsTTY(): boolean {
      return baseRuntime.stdinIsTTY;
    },
    get columns(): number {
      return state.columns;
    },
    set columns(value: number) {
      state.columns = sanitizeDimension(value);
    },
    get rows(): number {
      return state.rows;
    },
    set rows(value: number) {
      state.rows = sanitizeDimension(value);
    },
    get refreshRate(): number {
      return baseRuntime.refreshRate;
    },
  };

  (ctx as { runtime: RuntimePort }).runtime = runtime;
  return runtime;
}

/** Write an error message to stderr if available, otherwise stdout. */
function writeErrorLine(io: WritePort, data: string): void {
  if (io.writeError != null) {
    io.writeError(data);
    return;
  }
  io.write(data);
}
