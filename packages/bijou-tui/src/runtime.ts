import {
  getDefaultContext,
  createSurface,
  stringToSurface,
  surfaceToString,
  resolveClock,
  installRuntimeViewportOverlay,
  readRuntimeViewport,
  updateRuntimeViewport,
} from '@flyingrobots/bijou';
import type { WritePort, Surface, TimerHandle } from '@flyingrobots/bijou';
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
import type { RuntimeIssue } from './types.js';

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
const FATAL_RENDER_ERROR_KEY = '__fatalRenderError';

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
  installRuntimeViewportOverlay(ctx);
  const useAltScreen = options?.altScreen ?? true;
  const useHideCursor = options?.hideCursor ?? true;
  const useMouse = options?.mouse ?? false;
  installBCSSResolver(ctx, options?.css);
  const runtimeViewport = () => readRuntimeViewport(ctx.runtime);

  const [initModel, initCmds] = app.init();

  // Non-interactive: render once and return
  if (ctx.mode !== 'interactive') {
    const viewOutput = app.view(initModel);
    const viewport = runtimeViewport();
    const normalized = normalizeViewOutput(viewOutput, {
      width: viewport.columns,
      height: viewport.rows,
    });
    const output = surfaceToString(normalized.surface, ctx.style);
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
  let crashMode = false;

  // Double buffering: keep a visible front buffer and a reusable back buffer.
  const initialViewport = runtimeViewport();
  let currentSurface: Surface = createSurface(initialViewport.columns, initialViewport.rows);
  let nextSurface: Surface = createSurface(initialViewport.columns, initialViewport.rows);

  // Pooled output byte buffer for the packed differ's direct-byte path.
  // Sized against the current viewport with an upper-bound cell budget
  // (every cell worst-case ~64 bytes of ANSI + char). Reused across frames
  // and resized in lockstep with the framebuffers on terminal resize.
  let outBuf: Uint8Array = allocOutBuf(initialViewport.columns, initialViewport.rows);

  function resetFramebuffers(columns: number, rows: number): void {
    currentSurface = createSurface(columns, rows);
    nextSurface = createSurface(columns, rows);
    outBuf = allocOutBuf(columns, rows);
  }

  function ensureFramebufferSize(columns: number, rows: number): void {
    if (
      currentSurface.width === columns
      && currentSurface.height === rows
      && nextSurface.width === columns
      && nextSurface.height === rows
    ) {
      return;
    }
    resetFramebuffers(columns, rows);
  }

  function routeRuntimeIssue(issue: RuntimeIssue): void {
    const routed = app.routeRuntimeIssue?.(issue);
    if (routed !== undefined) {
      bus.emit(routed);
    }
  }

  function formatModelSnapshot(snapshot: unknown): string {
    try {
      const serialized = JSON.stringify(snapshot, null, 2);
      return serialized ?? String(snapshot);
    } catch {
      return '[unserializable model snapshot]';
    }
  }

  function buildCrashSurface(
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ): Surface {
    const viewport = runtimeViewport();
    ensureFramebufferSize(viewport.columns, viewport.rows);
    const detail = error instanceof Error
      ? error.stack ?? error.message
      : String(error);
    const content = [
      'Bijou runtime crash',
      '',
      `Phase: ${phase}`,
      '',
      'Error',
      detail,
      '',
      'Model snapshot',
      formatModelSnapshot(snapshot),
      '',
      'Press Enter to exit.',
    ].join('\n');
    return stringToSurface(content, viewport.columns, viewport.rows);
  }

  function enterCrashMode(
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ): void {
    if (fatalError === null) {
      fatalError = error;
    }
    const detail = error instanceof Error ? error.stack ?? error.message : String(error);
    writeErrorLine(ctx.io, `[Runtime Error] ${detail}\n`);
    if (crashMode) return;

    crashMode = true;
    renderQueued = false;
    disposeTimerHandle(renderHandle);
    renderHandle = null;
    bus.stopPulse();

    try {
      const crashSurface = buildCrashSurface(phase, error, snapshot);
      renderSurfaceFrame(
        ctx.io,
        currentSurface,
        crashSurface,
        ctx.style,
        outBuf,
      );
      currentSurface = crashSurface;
      nextSurface = createSurface(crashSurface.width, crashSurface.height);
    } catch (crashRenderError) {
      writeErrorLine(
        ctx.io,
        `[Runtime Error] Failed to render crash surface: ${crashRenderError instanceof Error ? (crashRenderError.stack ?? crashRenderError.message) : String(crashRenderError)}\n`,
      );
      shutdown(fatalError);
    }
  }

  const bus = createEventBus<M>({
    clock,
    onCommandRejected(error) {
      const message = error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
      writeErrorLine(ctx.io, `[EventBus] Command rejected: ${message}\n`);
      routeRuntimeIssue({
        level: 'error',
        source: 'command',
        message,
        atMs: clock.now(),
        error,
      });
    },
    onError(message, error) {
      const detail = error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
      writeErrorLine(ctx.io, `${message} ${detail}\n`);
      routeRuntimeIssue({
        level: 'warning',
        source: 'eventbus',
        message: `${message} ${detail}`,
        atMs: clock.now(),
        error,
      });
    },
  });

  // Setup Programmable Rendering Pipeline
  const pipeline = createPipeline();

  // 1. Layout Logic Stage
  pipeline.use('Layout', (state, next) => {
    let viewOutput;
    try {
      viewOutput = app.view(state.model);
    } catch (error) {
      state.data[FATAL_RENDER_ERROR_KEY] = error;
      return;
    }
    const viewport = runtimeViewport();
    (state as any).layoutRoot = wrapViewOutputAsLayoutRoot(viewOutput, {
      width: viewport.columns,
      height: viewport.rows,
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
      state.ctx.style,
      state.outBuf,
    );
    next();
  });

  // Add default Output stage (sync current surface)
  pipeline.use('Output', (state, next) => {
    const previousFront = state.currentSurface;
    currentSurface = state.targetSurface;
    nextSurface = previousFront;
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
  let renderQueued = false;
  let renderInFlight = false;
  let renderHandle: TimerHandle | null = null;
  function scheduleRender(): void {
    if (renderHandle != null || renderInFlight) return;

    const scheduledHandle = clock.setTimeout(() => {
      if (renderHandle === scheduledHandle) {
        renderHandle = null;
      }
      scheduledHandle.dispose();
      if (!renderQueued) {
        return;
      }

      renderInFlight = true;
      renderQueued = false;

      try {
        const viewport = runtimeViewport();
        ensureFramebufferSize(
          viewport.columns,
          viewport.rows,
        );
        nextSurface.clear();

        const renderState: RenderState = {
          model,
          ctx,
          dt: currentDt,
          currentSurface,
          targetSurface: nextSurface,
          outBuf,
          layoutMap: new Map(),
          data: {},
        };

        pipeline.execute(renderState);
        const fatalRenderError = renderState.data[FATAL_RENDER_ERROR_KEY];
        if (fatalRenderError !== undefined) {
          enterCrashMode('render', fatalRenderError, model);
        }
      } catch (error) {
        enterCrashMode('render', error, model);
      } finally {
        renderInFlight = false;
        if (renderQueued) {
          scheduleRender();
        }
      }
    }, 0);

    renderHandle = scheduledHandle;
  }

  /** Render the current model's view to the terminal. */
  function render(): void {
    if (!running) return;
    renderQueued = true;
    scheduleRender();
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

    if (crashMode) {
      if (isKeyMsg(msg) && (msg.key === 'enter' || (msg.key === 'c' && msg.ctrl))) {
        shutdown(fatalError);
      }
      return;
    }

    // Track time delta from pulse
    if (isPulseMsg(msg)) {
      currentDt = msg.dt;
    }

    if (isResizeMsg(msg)) {
      const viewport = updateRuntimeViewport(ctx.runtime, msg.columns, msg.rows);
      resetFramebuffers(
        viewport.columns,
        viewport.rows,
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

    const previousModel = model;
    let updateResult: [Model, Cmd<M>[]];
    try {
      updateResult = app.update(msg, model);
    } catch (error) {
      enterCrashMode('update', error, model);
      return;
    }
    const [newModel, cmds] = updateResult;
    model = newModel;
    if (isResizeMsg(msg) || newModel !== previousModel) {
      render();
    }
    executeCommands(cmds);
  });

  // Apply an initial runtime-size sync before first render.
  // This keeps framed apps sized from ports instead of process globals.
  const syncedViewport = runtimeViewport();
  const initialResize: ResizeMsg = {
    type: 'resize',
    columns: syncedViewport.columns,
    rows: syncedViewport.rows,
  };
  let resizeCmds: Cmd<M>[] = [];
  try {
    const [resizedModel, nextResizeCmds] = app.update(initialResize, model);
    model = resizedModel;
    resizeCmds = nextResizeCmds;
  } catch (error) {
    enterCrashMode('resize', error, model);
  }

  // After a potential resize in update, ensure currentSurface matches size
  // to avoid diffing mismatched grids.
  const postResizeViewport = runtimeViewport();
  resetFramebuffers(postResizeViewport.columns, postResizeViewport.rows);

  // Initial render + startup commands
  if (!crashMode) {
    render();
    executeCommands(initCmds);
    executeCommands(resizeCmds);
  }

  // Wait for quit signal
  await new Promise<void>((resolve) => {
    resolveQuit = resolve;
    if (!running) resolve();
  });

  // Ensure any pending render is flushed before exiting
  if (renderHandle != null || renderInFlight) {
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

/**
 * Upper-bound byte budget per surface cell for the pooled output buffer.
 * Each cell can emit at most a CUP move (~10 bytes), a full RGB SGR
 * prefix (~44 bytes), four modifier codes (~16 bytes), a grapheme
 * (~4 bytes UTF-8 in the fast path, ~28 bytes for side-table emoji
 * clusters), and an SGR reset (~4 bytes). 96 bytes per cell covers the
 * worst case where diff-gradient-style frames emit a unique style per
 * cell with no batching; the differ also flushes mid-frame if the
 * pool runs low, so this budget is a comfort margin rather than an
 * absolute bound.
 */
const OUTBUF_BYTES_PER_CELL = 96;
/** Fixed slack added on top of the cell budget for ANSI preamble/tail. */
const OUTBUF_SLACK = 8192;

/**
 * Allocate a pooled output buffer sized to a given viewport.
 *
 * @param columns - Terminal columns in the current viewport.
 * @param rows    - Terminal rows in the current viewport.
 * @returns A zero-initialized Uint8Array large enough for a worst-case
 *          frame in this viewport.
 */
function allocOutBuf(columns: number, rows: number): Uint8Array {
  return new Uint8Array(columns * rows * OUTBUF_BYTES_PER_CELL + OUTBUF_SLACK);
}

/** Write an error message to stderr if available, otherwise stdout. */
function writeErrorLine(io: WritePort, data: string): void {
  if (io.writeError != null) {
    io.writeError(data);
    return;
  }
  io.write(data);
}
