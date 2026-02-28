/**
 * Declarative keybinding manager for TUI applications.
 *
 * Matches incoming KeyMsg events against registered bindings and returns
 * the associated action. Bindings can be enabled/disabled at runtime
 * and carry help text for automatic help generation.
 *
 * ```ts
 * const kb = createKeyMap<Msg>()
 *   .bind('q', 'Quit', { type: 'quit' })
 *   .bind('?', 'Toggle help', { type: 'toggle-help' })
 *   .bind('ctrl+c', 'Force quit', { type: 'force-quit' })
 *   .group('Navigation', (g) => g
 *     .bind('j', 'Down', { type: 'move', dir: 'down' })
 *     .bind('k', 'Up', { type: 'move', dir: 'up' })
 *   );
 *
 * // In TEA update:
 * const action = kb.handle(keyMsg);
 * if (action !== undefined) return [model, action];
 * ```
 */

import type { KeyMsg } from './types.js';
import type { InputHandler } from './inputstack.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A parsed key descriptor: the key name + modifier flags. */
export interface KeyCombo {
  /** Key name (e.g. `"q"`, `"enter"`, `"tab"`). */
  readonly key: string;
  /** Whether the Ctrl modifier is required. */
  readonly ctrl: boolean;
  /** Whether the Alt modifier is required. */
  readonly alt: boolean;
  /** Whether the Shift modifier is required. */
  readonly shift: boolean;
}

/**
 * A single registered binding associating a key combo with an action.
 *
 * @template A - Action type returned when this binding matches.
 */
export interface Binding<A> {
  /** Key combination that triggers this binding. */
  readonly combo: KeyCombo;
  /** Human-readable description for help text. */
  readonly description: string;
  /** Group name this binding belongs to (empty string if ungrouped). */
  readonly group: string;
  /** Action to return when this binding matches. */
  readonly action: A;
  /** Whether this binding is currently active. */
  enabled: boolean;
}

/** Read-only view of a binding for help generation and introspection. */
export interface BindingInfo {
  /** Key combination that triggers this binding. */
  readonly combo: KeyCombo;
  /** Human-readable description for help text. */
  readonly description: string;
  /** Group name this binding belongs to. */
  readonly group: string;
  /** Whether this binding is currently active. */
  readonly enabled: boolean;
}

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

/**
 * Group builder — same as KeyMap but scoped to a group name.
 *
 * @template A - Action type returned when a binding matches.
 */
export interface KeyMapGroup<A> {
  /**
   * Register a binding within this group.
   *
   * @param key - Key descriptor string (e.g. `"j"`, `"ctrl+c"`).
   * @param description - Human-readable description for help text.
   * @param action - Action to return when this binding matches.
   * @returns This group builder for chaining.
   */
  bind(key: string, description: string, action: A): KeyMapGroup<A>;
}

// ---------------------------------------------------------------------------
// Key descriptor parsing
// ---------------------------------------------------------------------------

/**
 * Parse a key descriptor string into a {@link KeyCombo}.
 *
 * Examples: `"q"`, `"ctrl+c"`, `"alt+shift+tab"`, `"enter"`, `"space"`
 *
 * @param descriptor - Key descriptor string with optional modifier prefixes.
 * @returns Parsed key combo with key name and modifier flags.
 * @throws {Error} If a modifier is duplicated, unknown, or the key part is empty.
 */
export function parseKeyCombo(descriptor: string): KeyCombo {
  // Lowercase the entire descriptor for consistency with parseKey(), which always
  // returns lowercase key names (e.g., 'escape', 'enter', 'c' for Ctrl+C).
  // Uppercase letter bindings should use 'shift+a' not 'A'.
  const parts = descriptor.toLowerCase().split('+');
  let ctrl = false;
  let alt = false;
  let shift = false;

  // All parts except the last are modifiers
  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i];
    if (mod === 'ctrl') {
      if (ctrl) throw new Error(`Duplicate modifier "ctrl" in key descriptor "${descriptor}"`);
      ctrl = true;
    } else if (mod === 'alt') {
      if (alt) throw new Error(`Duplicate modifier "alt" in key descriptor "${descriptor}"`);
      alt = true;
    } else if (mod === 'shift') {
      if (shift) throw new Error(`Duplicate modifier "shift" in key descriptor "${descriptor}"`);
      shift = true;
    } else {
      throw new Error(`Unknown modifier "${mod}" in key descriptor "${descriptor}"`);
    }
  }

  const key = parts[parts.length - 1]!;

  if (key === '') {
    throw new Error(`Empty key in key descriptor "${descriptor}"`);
  }

  return { key, ctrl, alt, shift };
}

/**
 * Format a {@link KeyCombo} back into a human-readable string.
 *
 * Capitalize modifier names and multi-character key names.
 * Examples: `"Ctrl+c"`, `"q"`, `"Shift+Tab"`
 *
 * @param combo - Key combo to format.
 * @returns Human-readable key string.
 */
export function formatKeyCombo(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push('Ctrl');
  if (combo.alt) parts.push('Alt');
  if (combo.shift) parts.push('Shift');

  // Capitalize named keys, leave single chars lowercase
  const key = combo.key.length > 1
    ? combo.key.charAt(0).toUpperCase() + combo.key.slice(1)
    : combo.key;
  parts.push(key);

  return parts.join('+');
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Test whether a key combo matches a key message exactly.
 *
 * @param combo - Registered key combo to match against.
 * @param msg - Incoming key message from the terminal.
 * @returns `true` if all key name and modifier flags match.
 */
function matches(combo: KeyCombo, msg: KeyMsg): boolean {
  return (
    combo.key === msg.key &&
    combo.ctrl === msg.ctrl &&
    combo.alt === msg.alt &&
    combo.shift === msg.shift
  );
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/** Group name used for bindings registered outside any named group. */
const DEFAULT_GROUP = '';

/**
 * Create a new keybinding manager.
 *
 * Return a fluent {@link KeyMap} that registers key bindings, matches
 * incoming {@link KeyMsg} events, and supports runtime enable/disable
 * of individual bindings or groups.
 *
 * @template A - Action type returned when a binding matches.
 * @returns A new empty key map.
 */
export function createKeyMap<A>(): KeyMap<A> {
  const allBindings: Binding<A>[] = [];
  let currentGroup = DEFAULT_GROUP;

  function makePredicate(
    input: string | ((b: BindingInfo) => boolean),
  ): (b: Binding<A>) => boolean {
    if (typeof input === 'string') {
      return (b) => b.description === input;
    }
    return input;
  }

  const keymap: KeyMap<A> = {
    bind(key, description, action) {
      const combo = parseKeyCombo(key);
      allBindings.push({
        combo,
        description,
        group: currentGroup,
        action,
        enabled: true,
      });
      return keymap;
    },

    group(name, fn) {
      const prevGroup = currentGroup;
      currentGroup = name;

      const groupBuilder: KeyMapGroup<A> = {
        bind(key, description, action) {
          keymap.bind(key, description, action);
          return groupBuilder;
        },
      };

      try {
        fn(groupBuilder);
      } finally {
        currentGroup = prevGroup;
      }
      return keymap;
    },

    handle(msg) {
      for (const binding of allBindings) {
        if (binding.enabled && matches(binding.combo, msg)) {
          return binding.action;
        }
      }
      return undefined;
    },

    enable(predicate) {
      const pred = makePredicate(predicate);
      for (const b of allBindings) {
        if (pred(b)) b.enabled = true;
      }
    },

    disable(predicate) {
      const pred = makePredicate(predicate);
      for (const b of allBindings) {
        if (pred(b)) b.enabled = false;
      }
    },

    enableGroup(group) {
      for (const b of allBindings) {
        if (b.group === group) b.enabled = true;
      }
    },

    disableGroup(group) {
      for (const b of allBindings) {
        if (b.group === group) b.enabled = false;
      }
    },

    bindings() {
      // Fresh snapshot each call — intentional to reflect enable/disable mutations.
      return allBindings.map((b) => ({
        combo: b.combo,
        description: b.description,
        group: b.group,
        enabled: b.enabled,
      }));
    },
  };

  return keymap;
}
