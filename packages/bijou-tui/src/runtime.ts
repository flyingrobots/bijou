import { getDefaultContext } from '@flyingrobots/bijou';
import type { WritePort } from '@flyingrobots/bijou';
import type { App, Cmd, RunOptions, ResizeMsg } from './types.js';
import { isKeyMsg } from './types.js';
import { enterScreen, exitScreen, renderFrame } from './screen.js';
import { createEventBus } from './eventbus.js';

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
  options?: RunOptions,
): Promise<void> {
  const ctx = options?.ctx ?? getDefaultContext();
  const useAltScreen = options?.altScreen ?? true;
  const useHideCursor = options?.hideCursor ?? true;
  const useMouse = options?.mouse ?? false;

  const [initModel, initCmds] = app.init();

  // Non-interactive: render once and return
  if (ctx.mode !== 'interactive') {
    ctx.io.write(app.view(initModel));
    return;
  }

  // Interactive mode
  let model = initModel;
  let running = true;
  let lastCtrlC = 0;
  let resolveQuit: (() => void) | null = null;

  const bus = createEventBus<M>({
    onCommandRejected(error) {
      const message = error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
      writeErrorLine(ctx.io, `[EventBus] Command rejected: ${message}\n`);
    },
  });

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
  /** Render the current model's view to the terminal. */
  function render(): void {
    if (!running) return;
    renderFrame(ctx.io, app.view(model));
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

  // Single subscription drives the entire update cycle
  bus.on((msg) => {
    if (!running) return;

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

  // Initial render + startup commands
  render();
  executeCommands(initCmds);
  executeCommands(resizeCmds);

  // Wait for quit signal
  await new Promise<void>((resolve) => {
    resolveQuit = resolve;
    if (!running) resolve();
  });

  // Cleanup — bus disposes all I/O connections
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
