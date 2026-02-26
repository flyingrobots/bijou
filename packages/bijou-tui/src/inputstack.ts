/**
 * Stack-based input dispatch for layered TUI input handling.
 *
 * Input events are dispatched top-down through the stack. Each layer
 * can consume an event (returning an action) or pass it through to
 * layers below. Layers default to opaque (consuming all matched input),
 * but can be pushed as passthrough to let unmatched events fall through
 * even when they match nothing.
 *
 * ```ts
 * const stack = createInputStack<Msg>();
 *
 * // Base layer — global keys, always lets events fall through
 * const baseId = stack.push(appKeys, { passthrough: true });
 *
 * // Modal opens — captures all input
 * const modalId = stack.push(modalKeys);
 *
 * // In TEA update — dispatch returns first matched action
 * const action = stack.dispatch(keyMsg);
 *
 * // Modal closes
 * stack.pop();
 * // or: stack.remove(modalId);
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Anything that can handle an input message and optionally return an action.
 * Return `undefined` to indicate "not handled" (pass through).
 *
 * `KeyMap<A>.handle()` already satisfies this interface.
 */
export interface InputHandler<Msg, A> {
  handle(msg: Msg): A | undefined;
}

/** Options when pushing a layer onto the stack. */
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

/** Read-only info about a layer in the stack. */
export interface LayerInfo {
  readonly id: number;
  readonly name: string;
  readonly passthrough: boolean;
}

/** The input stack. */
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

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

interface Layer<Msg, A> {
  readonly id: number;
  readonly handler: InputHandler<Msg, A>;
  readonly passthrough: boolean;
  readonly name: string;
}

export function createInputStack<Msg, A>(): InputStack<Msg, A> {
  const stack: Layer<Msg, A>[] = [];
  let nextId = 1;

  return {
    push(handler, options) {
      const id = nextId++;
      stack.push({
        id,
        handler,
        passthrough: options?.passthrough ?? false,
        name: options?.name ?? '',
      });
      return id;
    },

    pop() {
      const layer = stack.pop();
      if (!layer) return undefined;
      return { id: layer.id, name: layer.name, passthrough: layer.passthrough };
    },

    remove(id) {
      const idx = stack.findIndex((l) => l.id === id);
      if (idx === -1) return false;
      stack.splice(idx, 1);
      return true;
    },

    dispatch(msg) {
      // Walk top-down
      for (let i = stack.length - 1; i >= 0; i--) {
        const layer = stack[i]!;
        const action = layer.handler.handle(msg);

        if (action !== undefined) {
          return action;
        }

        // Not handled — check if this layer blocks further dispatch
        if (!layer.passthrough) {
          return undefined;
        }
      }

      return undefined;
    },

    layers() {
      return stack.map((l) => ({
        id: l.id,
        name: l.name,
        passthrough: l.passthrough,
      }));
    },

    get size() {
      return stack.length;
    },
  };
}
