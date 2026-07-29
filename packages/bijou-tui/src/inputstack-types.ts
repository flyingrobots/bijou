/** Type contracts for stack-based input dispatch. */

/**
 * Anything that can handle an input message and optionally return an action.
 *
 * Return `undefined` to indicate "not handled" (pass through).
 * {@link KeyMap}.handle() already satisfies this interface.
 *
 * @template Msg - Input message type.
 * @template A - Action type returned on match.
 */
export interface InputHandler<Msg, A> {
  /**
   * Attempt to handle the given message.
   *
   * @param msg - Input message to handle.
   * @returns The matched action, or `undefined` if not handled.
   */
  handle(msg: Msg): A | undefined;
}

/** Configuration options when pushing a layer onto the stack. */
export interface LayerOptions {
  /**
   * When true, unhandled events pass through to layers below even
   * when this layer is on top. When false (default), the layer is
   * opaque — events that reach it but aren't handled are swallowed.
   */
  passthrough?: boolean;

  /** Optional name for debugging and removal by name. */
  name?: string;
}

/** Read-only snapshot of a layer's metadata. */
export interface LayerInfo {
  /** Unique identifier assigned when the layer was pushed. */
  readonly id: number;
  /** Layer name (empty string if unnamed). */
  readonly name: string;
  /** Whether unhandled events pass through to layers below. */
  readonly passthrough: boolean;
}

/**
 * Stack-based input dispatcher for layered TUI input handling.
 *
 * @template Msg - Input message type dispatched through the stack.
 * @template A - Action type returned when a handler matches.
 */
export interface InputStack<Msg, A> {
  /**
   * Push a handler onto the top of the stack.
   * Returns a unique layer ID for targeted removal.
   */
  push(handler: InputHandler<Msg, A>, options?: LayerOptions): number;

  /** Remove and return the top layer. Returns undefined if empty. */
  pop(): LayerInfo | undefined;

  /** Remove a specific layer by ID. Returns true if found. */
  remove(id: number): boolean;

  /**
   * Dispatch a message through the stack, top-down.
   *
   * - If a layer's handler returns an action, dispatch returns it immediately.
   * - If a layer's handler returns undefined:
   *   - passthrough layer: continue to the next layer
   *   - opaque layer: stop, return undefined (event swallowed)
   */
  dispatch(msg: Msg): A | undefined;

  /** Return info about all layers, bottom to top. */
  layers(): readonly LayerInfo[];

  /** Number of layers in the stack. */
  readonly size: number;
}

/**
 * Internal layer entry stored in the stack.
 *
 * @template Msg - Input message type.
 * @template A - Action type returned on match.
 */
export interface Layer<Msg, A> {
  /** Unique identifier assigned at push time. */
  readonly id: number;
  /** Handler that processes input messages for this layer. */
  readonly handler: InputHandler<Msg, A>;
  /** Whether unhandled events pass through to layers below. */
  readonly passthrough: boolean;
  /** Layer name for debugging (empty string if unnamed). */
  readonly name: string;
}
