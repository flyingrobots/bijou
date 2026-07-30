import { RuntimeFramebuffers } from './runtime-buffers.js';
import type { RuntimeSession } from './runtime-contract.js';
import type {
  App,
  Cmd,
  ResizeMsg,
} from './types.js';

export function createRuntimeSession<Model>(
  model: Model,
): RuntimeSession<Model> {
  return {
    model,
    running: true,
    lastCtrlC: null,
    currentDt: 0.016,
    fatalError: null,
    crashMode: false,
    resolveQuit: null,
    renderQueued: false,
    renderInFlight: false,
    renderHandle: null,
  };
}

/** Apply the initial viewport message and align both framebuffers afterward. */
export function synchronizeInitialViewport<Model, M>(
  app: App<Model, M>,
  session: RuntimeSession<Model>,
  viewport: () => { columns: number; rows: number },
  buffers: RuntimeFramebuffers,
  crash: (
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ) => void,
): Cmd<M>[] {
  const size = viewport();
  const resize: ResizeMsg = {
    type: 'resize',
    columns: size.columns,
    rows: size.rows,
  };
  let commands: Cmd<M>[] = [];
  try {
    [session.model, commands] = app.update(resize, session.model);
  } catch (error) {
    crash('resize', error, session.model);
  }
  const postResize = viewport();
  buffers.reset(postResize.columns, postResize.rows);
  return commands;
}
