import { getDefaultContext } from '@flyingrobots/bijou';
import type { App, Cmd, KeyMsg, ResizeMsg, RunOptions } from './types.js';
import { QUIT } from './types.js';
import { parseKey } from './keys.js';
import { enterScreen, exitScreen, renderFrame } from './screen.js';

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
 * Terminal resize events are automatically dispatched as `ResizeMsg`
 * messages to the `update` function.
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

  function shutdown(): void {
    if (!running) return;
    running = false;
    if (resolveQuit) resolveQuit();
  }

  // Setup screen
  if (useAltScreen || useHideCursor) {
    enterScreen(ctx.io);
  }
  // Disable mouse reporting to avoid garbage from mouse events
  ctx.io.write(DISABLE_MOUSE);

  // Render helper
  function render(): void {
    if (!running) return;
    renderFrame(ctx.io, app.view(model));
  }

  // Message handler
  function handleMsg(msg: KeyMsg | ResizeMsg | M): void {
    if (!running) return;
    const [newModel, cmds] = app.update(msg, model);
    model = newModel;
    render();
    executeCommands(cmds);
  }

  // Execute commands, feeding results back as messages
  function executeCommands(cmds: Cmd<M>[]): void {
    for (const cmd of cmds) {
      void cmd().then((result) => {
        if (result === QUIT) {
          shutdown();
          return;
        }
        if (result !== undefined) {
          handleMsg(result as M);
        }
      });
    }
  }

  // Initial render
  render();

  // Execute startup commands
  executeCommands(initCmds);

  // Start keyboard listener
  const inputHandle = ctx.io.rawInput((raw: string) => {
    if (!running) return;

    const keyMsg = parseKey(raw);

    // Skip unknown sequences (mouse events, etc.)
    if (keyMsg.key === 'unknown') return;

    // Double Ctrl+C force-quit
    if (keyMsg.key === 'c' && keyMsg.ctrl) {
      const now = Date.now();
      if (now - lastCtrlC < 1000) {
        shutdown();
        return;
      }
      lastCtrlC = now;
    }

    handleMsg(keyMsg);
  });

  // Start resize listener
  const resizeHandle = ctx.io.onResize((columns, rows) => {
    if (!running) return;
    const msg: ResizeMsg = { type: 'resize', columns, rows };
    handleMsg(msg);
  });

  // Wait for quit signal
  await new Promise<void>((resolve) => {
    resolveQuit = resolve;
    // In case shutdown was already called before we got here
    if (!running) resolve();
  });

  // Cleanup
  inputHandle.dispose();
  resizeHandle.dispose();
  if (useAltScreen || useHideCursor) {
    exitScreen(ctx.io);
  }
}
