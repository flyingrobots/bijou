import type { App, Cmd, QuitSignal } from '../types.js';
import { isCmdCleanup } from '../types.js';
import type { ViewOutput } from '../view-output.js';

/**
 * Options for mounting a sub-app.
 *
 * @template SubModel - The sub-app's model type.
 * @template SubMsg - The sub-app's message type.
 * @template ParentMsg - The parent app's message type.
 */
export interface MountOptions<SubModel, SubMsg, ParentMsg> {
  /** The current state of the sub-app. */
  model: SubModel;
  /** Function to map a sub-app message into a parent message. */
  onMsg: (msg: SubMsg) => ParentMsg;
  /**
   * Optional function to intercept and handle `Cmd`s emitted by the sub-app.
   * If not provided, commands are automatically mapped using `onMsg`.
   */
  mapCmd?: (cmd: Cmd<SubMsg>) => Cmd<ParentMsg>;
}

/**
 * A mounted sub-app instance ready to be rendered.
 *
 * This is typically returned by the parent's `view` function
 * and blitted onto the parent's surface.
 */
export interface MountedApp<SubMsg> {
  /** The rendered surface or layout tree of the sub-app. */
  surfaceOrNode: ViewOutput;
  /**
   * Any TEA commands the sub-app needs to execute.
   * These should be dispatched by the parent during its update cycle.
   */
  cmds: Cmd<SubMsg>[];
}

export type SubAppAdapterCases<ParentMsg, SubMsg extends { readonly type: string }> = {
  readonly [K in SubMsg['type']]: (msg: Extract<SubMsg, { type: K }>) => ParentMsg;
};

/**
 * Mount a sub-app, returning its rendered surface and any pending commands.
 *
 * @template SubModel - The sub-app's model type.
 * @template SubMsg - The sub-app's message type.
 * @template ParentMsg - The parent app's message type.
 *
 * @param app - The TEA application to mount.
 * @param options - Configuration for the mounted instance.
 * @returns A tuple of `[Surface | LayoutNode, mapped Cmds]`.
 */
export function mount<SubModel, SubMsg, ParentMsg>(
  app: App<SubModel, SubMsg>,
  options: MountOptions<SubModel, SubMsg, ParentMsg>,
): [ViewOutput, Cmd<ParentMsg>[]] {
  const { model } = options;

  const surfaceOrNode = app.view(model);

  return [surfaceOrNode, []];
}

/**
 * Build an exhaustive discriminant-based sub-app message mapper.
 *
 * The returned function matches the `onMsg` signature expected by
 * `initSubApp()`, `updateSubApp()`, and `mount()`, while TypeScript enforces
 * that every `SubMsg['type']` variant is covered up front.
 */
export function createSubAppAdapter<ParentMsg, SubMsg extends { readonly type: string }>(
  cases: SubAppAdapterCases<ParentMsg, SubMsg>,
): (msg: SubMsg) => ParentMsg {
  return (msg) => {
    const handler = cases[msg.type as keyof SubAppAdapterCases<ParentMsg, SubMsg>] as (msg: SubMsg) => ParentMsg;
    return handler(msg);
  };
}

export interface SubAppOptions<SubMsg, ParentMsg> {
  /** Function to map a sub-app message into a parent message. */
  onMsg: (msg: SubMsg) => ParentMsg;
  /**
   * Optional function to intercept and handle `Cmd`s emitted by the sub-app.
   * If not provided, commands are automatically mapped using `onMsg`.
   */
  mapCmd?: (cmd: Cmd<SubMsg>) => Cmd<ParentMsg>;
}

export function initSubApp<SubModel, SubMsg, ParentMsg>(
  app: App<SubModel, SubMsg>,
  options: SubAppOptions<SubMsg, ParentMsg>,
): [SubModel, Cmd<ParentMsg>[]] {
  const [model, cmds] = app.init();
  return [model, mapSubAppCmds(cmds, options)];
}

export function updateSubApp<SubModel, SubMsg, ParentMsg>(
  app: App<SubModel, SubMsg>,
  msg: SubMsg,
  model: SubModel,
  options: SubAppOptions<SubMsg, ParentMsg>,
): [SubModel, Cmd<ParentMsg>[]] {
  const [nextModel, cmds] = app.update(msg, model);
  return [nextModel, mapSubAppCmds(cmds, options)];
}

/**
 * Helper to map an array of sub-app commands into parent commands.
 *
 * @param cmds - The sub-app commands to map.
 * @param mapper - The message mapping function.
 * @returns An array of commands that emit parent messages.
 */
export function mapCmds<SubMsg, ParentMsg>(
  cmds: Cmd<SubMsg>[],
  mapper: (msg: SubMsg) => ParentMsg,
): Cmd<ParentMsg>[] {
  return cmds.map((cmd) => mapSingleCmd(cmd, mapper));
}

function mapSubAppCmds<SubMsg, ParentMsg>(
  cmds: Cmd<SubMsg>[],
  options: SubAppOptions<SubMsg, ParentMsg>,
): Cmd<ParentMsg>[] {
  if (options.mapCmd != null) {
    return cmds.map((cmd) => options.mapCmd!(cmd));
  }
  return mapCmds(cmds, options.onMsg);
}

/**
 * Map a single sub-app command to a parent command.
 */
function mapSingleCmd<SubMsg, ParentMsg>(
  cmd: Cmd<SubMsg>,
  mapper: (msg: SubMsg) => ParentMsg,
): Cmd<ParentMsg> {
  return async (emit, caps) => {
    // We intercept the sub-app's `emit` call to wrap its messages
    const mappedEmit = (subMsg: SubMsg) => {
      emit(mapper(subMsg));
    };

    const result = await cmd(mappedEmit, caps);

    // If the command resolves to a final message, map it.
    // Quit signals are passed through unaltered.
    if (result === undefined) return undefined;
    if (typeof result === 'symbol') return result as QuitSignal; // QUIT
    if (isCmdCleanup(result)) return result;
    return mapper(result as SubMsg);
  };
}
