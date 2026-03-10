import type { App, Cmd, QuitSignal } from '../types.js';
import type { Surface } from '@flyingrobots/bijou';

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
  /** The rendered surface of the sub-app. */
  surface: Surface;
  /**
   * Any TEA commands the sub-app needs to execute.
   * These should be dispatched by the parent during its update cycle.
   */
  cmds: Cmd<SubMsg>[];
}

/**
 * Mount a sub-app, returning its rendered surface and any pending commands.
 *
 * @template SubModel - The sub-app's model type.
 * @template SubMsg - The sub-app's message type.
 * @template ParentMsg - The parent app's message type.
 *
 * @param app - The TEA application to mount.
 * @param options - Configuration for the mounted instance.
 * @returns A tuple of `[Surface, mapped Cmds]`.
 */
export function mount<SubModel, SubMsg, ParentMsg>(
  app: App<SubModel, SubMsg>,
  options: MountOptions<SubModel, SubMsg, ParentMsg>,
): [Surface, Cmd<ParentMsg>[]] {
  const { model } = options;

  const rawSurface = app.view(model);
  
  // Handle migration wrapper if the sub-app still returns a string
  if (typeof rawSurface === 'string') {
    throw new Error('Sub-apps must return a Surface from view() in v3');
  }
  const surface = rawSurface;

  // We don't have commands from the view phase in standard TEA, 
  // but if we extend `mount` to handle `update` lifecycle forwarding,
  // this is where command mapping happens.
  // For now, `mount` is primarily a view-layer composition tool.

  return [surface, []];
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
    return mapper(result as SubMsg);
  };
}
