import {
  updateRuntimeViewport,
  type BijouContext,
  type ClockPort,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import { clearAndHome } from './screen.js';
import { isKeyMsg, isPulseMsg, isResizeMsg } from './types.js';
import type {
  App,
  Cmd,
} from './types.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import type {
  RuntimeRenderer,
  RuntimeSession,
} from './runtime-contract.js';

/** Connect the single TEA update subscription to runtime state. */
export function installRuntimeInput<Model, M>(
  app: App<Model, M>,
  bus: EventBus<M>,
  ctx: BijouContext,
  clock: ClockPort,
  session: RuntimeSession<Model>,
  buffers: RuntimeFramebuffers,
  renderer: RuntimeRenderer,
  crash: (
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ) => void,
  shutdown: (error?: unknown) => void,
): (commands: Cmd<M>[]) => void {
  const execute = (commands: Cmd<M>[]): void => {
    for (const command of commands) bus.runCmd(command);
  };
  bus.on((message) => {
    if (!session.running) return;
    if (session.crashMode) {
      if (
        isKeyMsg(message)
        && (message.key === 'enter'
          || (message.key === 'c' && message.ctrl))
      ) shutdown(session.fatalError);
      return;
    }
    if (isPulseMsg(message)) session.currentDt = message.dt;
    if (isResizeMsg(message)) {
      const viewport = updateRuntimeViewport(
        ctx.runtime,
        message.columns,
        message.rows,
      );
      buffers.reset(viewport.columns, viewport.rows, true);
      clearAndHome(ctx.io);
    }
    if (isKeyMsg(message) && message.key === 'c' && message.ctrl) {
      const now = clock.now();
      if (session.lastCtrlC != null && now - session.lastCtrlC < 1000) {
        shutdown();
        return;
      }
      session.lastCtrlC = now;
    }
    const previous = session.model;
    let result: [Model, Cmd<M>[]];
    try {
      result = app.update(message, session.model);
    } catch (error) {
      crash('update', error, session.model);
      return;
    }
    session.model = result[0];
    if (isResizeMsg(message) || session.model !== previous) {
      renderer.render();
    }
    execute(result[1]);
  });
  return execute;
}
