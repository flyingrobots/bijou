import { getDefaultContext } from '@flyingrobots/bijou';
import type { App, Cmd, KeyMsg, ResizeMsg, RunOptions } from './types.js';
import { enterScreen, exitScreen, renderFrame } from './screen.js';
import { createEventBus } from './eventbus.js';

/**
 * Disable mouse reporting sequences that terminals may send.
 * Some terminals auto-enable mouse tracking in alt screen mode.
 */
const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

/**
 * Run a TEA application.
 *
 * In non-interactive modes (pipe/static/accessible), renders the initial view
 * once and exits. In interactive mode, enters the alt screen, starts the
 * keyboard event loop, and drives the model/update/view cycle.
 *
 * All input sources (keyboard, resize, commands) are unified through an
 * internal EventBus — a single subscription drives the update cycle.
 */
export async function run<Model, M>(
  app: App<Model, M>,
  options?: RunOptions,
): Promise<void> {
  const ctx = options?.ctx ?? getDefaultContext();
  const useAltScreen = options?.altScreen ?? true;
  const useHideCursor = options?.hideCursor ?? true;

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

  const bus = createEventBus<M>();

  function shutdown(): void {
    if (!running) return;
    running = false;
    if (resolveQuit) resolveQuit();
  }

  // Setup screen
  if (useAltScreen || useHideCursor) {
    enterScreen(ctx.io);
  }
  ctx.io.write(DISABLE_MOUSE);

  // Render helper
  function render(): void {
    if (!running) return;
    renderFrame(ctx.io, app.view(model));
  }

  // Execute commands through the bus
  function executeCommands(cmds: Cmd<M>[]): void {
    for (const cmd of cmds) {
      bus.runCmd(cmd);
    }
  }

  // Connect I/O sources — keyboard + resize, parsed and unified
  bus.connectIO(ctx.io);

  // Handle quit signals from commands
  bus.onQuit(shutdown);

  // Single subscription drives the entire update cycle
  bus.on((msg) => {
    if (!running) return;

    // Double Ctrl+C force-quit
    const keyMsg = msg as KeyMsg;
    if (keyMsg.type === 'key' && keyMsg.key === 'c' && keyMsg.ctrl) {
      const now = Date.now();
      if (now - lastCtrlC < 1000) {
        shutdown();
        return;
      }
      lastCtrlC = now;
    }

    const [newModel, cmds] = app.update(msg as KeyMsg | ResizeMsg | M, model);
    model = newModel;
    render();
    executeCommands(cmds);
  });

  // Initial render + startup commands
  render();
  executeCommands(initCmds);

  // Wait for quit signal
  await new Promise<void>((resolve) => {
    resolveQuit = resolve;
    if (!running) resolve();
  });

  // Cleanup — bus disposes all I/O connections
  bus.dispose();
  if (useAltScreen || useHideCursor) {
    exitScreen(ctx.io);
  }
}
