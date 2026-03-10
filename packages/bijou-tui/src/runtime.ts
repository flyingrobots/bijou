import { getDefaultContext, createSurface, surfaceToString, stringToSurface } from '@flyingrobots/bijou';
import type { WritePort, Surface, LayoutNode } from '@flyingrobots/bijou';
import type { App, Cmd, RunOptions, ResizeMsg } from './types.js';
import { isKeyMsg, isPulseMsg } from './types.js';
import { enterScreen, exitScreen, renderSurfaceFrame } from './screen.js';
import { createEventBus } from './eventbus.js';
import { createPipeline, type RenderState } from './pipeline/pipeline.js';
import { bcssMiddleware } from './pipeline/middleware/css.js';
import { motionMiddleware } from './pipeline/middleware/motion.js';
import { paintMiddleware } from './pipeline/middleware/paint.js';
import { parseBCSS } from './css/parser.js';
import { resolveStyles } from './css/resolver.js';
import type { ThemeMode } from '@flyingrobots/bijou';

/**
 * Disable mouse reporting sequences that terminals may send.
 * Some terminals auto-enable mouse tracking in alt screen mode.
 */
const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

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
  const useAltScreen = options?.altScreen ?? true;
  const useHideCursor = options?.hideCursor ?? true;
  const useMouse = options?.mouse ?? false;

  const [initModel, initCmds] = app.init();

  // Non-interactive: render once and return
  if (ctx.mode !== 'interactive') {
    const viewOutput = app.view(initModel);
    let output: string;
    if (typeof viewOutput === 'string') {
      output = viewOutput;
    } else if ((viewOutput as any).cells) {
      output = surfaceToString(viewOutput as Surface, ctx.style);
    } else {
      // LayoutNode: paint to a temporary surface then to string
      const s = createSurface(sanitizeDimension(ctx.runtime.columns), sanitizeDimension(ctx.runtime.rows));
      const paintStage = paintMiddleware();
      const state: any = { targetSurface: s, layoutRoot: viewOutput };
      paintStage(state, () => {});
      output = surfaceToString(s, ctx.style);
    }
    ctx.io.write(output);
    return;
  }

  // Interactive mode
  let model = initModel;
  let running = true;
  let lastCtrlC = 0;
  let resolveQuit: (() => void) | null = null;
  let currentDt = 0.016; // Default to 60fps for first frame

  // Double Buffering: track what is currently on screen
  let currentSurface: Surface = createSurface(
    sanitizeDimension(ctx.runtime.columns),
    sanitizeDimension(ctx.runtime.rows),
  );

  const bus = createEventBus<M>({
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
    if (typeof viewOutput === 'string') {
      (state as any).layoutRoot = {
        rect: { x: 0, y: 0, width: sanitizeDimension(ctx.runtime.columns), height: sanitizeDimension(ctx.runtime.rows) },
        children: [],
        surface: stringToSurface(viewOutput, sanitizeDimension(ctx.runtime.columns), sanitizeDimension(ctx.runtime.rows))
      };
    } else if ((viewOutput as any).cells) {
      (state as any).layoutRoot = {
        rect: { x: 0, y: 0, width: (viewOutput as Surface).width, height: (viewOutput as Surface).height },
        children: [],
        surface: viewOutput as Surface
      };
    } else {
      (state as any).layoutRoot = viewOutput as LayoutNode;
    }
    next();
  });

  // 2. Motion Interpolation Stage
  pipeline.use('Layout', motionMiddleware());

  // Register BCSS middleware if provided
  if (options?.css) {
    const sheet = parseBCSS(options.css);
    pipeline.use('Layout', bcssMiddleware(options.css));

    // Determine theme mode
    const themeMode: ThemeMode = (ctx.runtime.env('COLORFGBG')?.split(';').pop() === '15' || ctx.runtime.env('TERM_PROGRAM') === 'Apple_Terminal') ? 'light' : 'dark';

    // Bridge: inject real CSS resolver into the context
    (ctx as any).resolveBCSS = (identity: any) => {
      return resolveStyles(identity, sheet, {
        width: ctx.runtime.columns,
        height: ctx.runtime.rows,
      }, ctx.tokenGraph, themeMode);
    };
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
    if (state.currentSurface.width !== state.targetSurface.width || state.currentSurface.height !== state.targetSurface.height) {
      currentSurface = state.targetSurface.clone();
    } else {
      state.currentSurface.blit(state.targetSurface, 0, 0);
    }
    next();
  });

  // Register user middleware
  if (options?.middlewares) {
    for (const mw of options.middlewares) {
      bus.use(mw);
    }
  }

  /** Tear down the run loop and signal the quit promise. */
  function shutdown(): void {
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
  /** Render the current model's view to the terminal. */
  function render(): void {
    if (!running || renderRequested) return;
    renderRequested = true;

    setTimeout(() => {
      renderRequested = false;

      const targetSurface = createSurface(sanitizeDimension(ctx.runtime.columns), sanitizeDimension(ctx.runtime.rows));

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
    }, 0);
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

    // Double Ctrl+C force-quit
    if (isKeyMsg(msg) && msg.key === 'c' && msg.ctrl) {
      const now = Date.now();
      if (now - lastCtrlC < 1000) {
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
      setTimeout(resolve, 0);
    });
  }

  // Cleanup — bus disposes all I/O connections
  bus.stopPulse();
  bus.dispose();
  if (useMouse) {
    ctx.io.write(DISABLE_MOUSE);
  }
  if (useAltScreen || useHideCursor) {
    exitScreen(ctx.io);
  }
}

/** Clamp a terminal dimension to a non-negative integer. */
function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/** Write an error message to stderr if available, otherwise stdout. */
function writeErrorLine(io: WritePort, data: string): void {
  if (io.writeError != null) {
    io.writeError(data);
    return;
  }
  io.write(data);
}
