import type { KeyMsg } from './types.js';
import type { InputHandler } from './inputstack.js';
import type { BindingInfo, KeyMapGroup } from './keybindings.part01.js';

/**
 * The keybinding manager.
 *
 * Provide a fluent API for registering key bindings, matching incoming
 * key events, and managing binding state at runtime.
 *
 * @template A - Action type returned when a binding matches.
 */
export interface KeyMap<A> extends InputHandler<KeyMsg, A> {
  /**
   * Register a binding. `key` is a descriptor like `"q"`, `"ctrl+c"`, `"shift+tab"`.
   *
   * @param key - Key descriptor string.
   * @param description - Human-readable description for help text.
   * @param action - Action to return when this binding matches.
   * @returns This key map for chaining.
   */
  bind(key: string, description: string, action: A): KeyMap<A>;

  /**
   * Register bindings under a named group.
   *
   * @param name - Group name for categorizing bindings.
   * @param fn - Builder callback receiving a scoped group builder.
   * @returns This key map for chaining.
   */
  group(name: string, fn: (g: KeyMapGroup<A>) => KeyMapGroup<A>): KeyMap<A>;

  /**
   * Match a {@link KeyMsg} and return its action, or `undefined` if no match.
   *
   * @param msg - Incoming key message to match against registered bindings.
   * @returns The matched action, or `undefined` if no enabled binding matches.
   */
  handle(msg: KeyMsg): A | undefined;

  /**
   * Enable bindings whose description matches the predicate.
   *
   * @param predicate - Description string for exact match, or a filter function.
   */
  enable(predicate: string | ((b: BindingInfo) => boolean)): void;

  /**
   * Disable bindings whose description matches the predicate.
   *
   * @param predicate - Description string for exact match, or a filter function.
   */
  disable(predicate: string | ((b: BindingInfo) => boolean)): void;

  /**
   * Enable all bindings in a group.
   *
   * @param group - Group name to enable.
   */
  enableGroup(group: string): void;

  /**
   * Disable all bindings in a group.
   *
   * @param group - Group name to disable.
   */
  disableGroup(group: string): void;

  /**
   * Return a snapshot of all bindings for help generation.
   *
   * @returns Read-only array of binding info objects.
   */
  bindings(): readonly BindingInfo[];
}
