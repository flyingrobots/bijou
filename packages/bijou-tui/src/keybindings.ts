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
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
}

/** A single registered binding. */
export interface Binding<A> {
  readonly combo: KeyCombo;
  readonly description: string;
  readonly group: string;
  readonly action: A;
  enabled: boolean;
}

/** Read-only view of a binding for help generation. */
export interface BindingInfo {
  readonly combo: KeyCombo;
  readonly description: string;
  readonly group: string;
  readonly enabled: boolean;
}

/** The keybinding manager. */
export interface KeyMap<A> extends InputHandler<KeyMsg, A> {
  /** Register a binding. `key` is a descriptor like `"q"`, `"ctrl+c"`, `"shift+tab"`. */
  bind(key: string, description: string, action: A): KeyMap<A>;

  /** Register bindings under a named group. */
  group(name: string, fn: (g: KeyMapGroup<A>) => KeyMapGroup<A>): KeyMap<A>;

  /** Match a KeyMsg and return its action, or undefined if no match. */
  handle(msg: KeyMsg): A | undefined;

  /** Enable bindings whose description matches the predicate. */
  enable(predicate: string | ((b: BindingInfo) => boolean)): void;

  /** Disable bindings whose description matches the predicate. */
  disable(predicate: string | ((b: BindingInfo) => boolean)): void;

  /** Enable all bindings in a group. */
  enableGroup(group: string): void;

  /** Disable all bindings in a group. */
  disableGroup(group: string): void;

  /** Return all bindings (for help generation). */
  bindings(): readonly BindingInfo[];
}

/** Group builder — same as KeyMap but scoped to a group name. */
export interface KeyMapGroup<A> {
  bind(key: string, description: string, action: A): KeyMapGroup<A>;
}

// ---------------------------------------------------------------------------
// Key descriptor parsing
// ---------------------------------------------------------------------------

/**
 * Parse a key descriptor string into a KeyCombo.
 *
 * Examples: `"q"`, `"ctrl+c"`, `"alt+shift+tab"`, `"enter"`, `"space"`
 */
export function parseKeyCombo(descriptor: string): KeyCombo {
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
 * Format a KeyCombo back into a human-readable string.
 *
 * Examples: `"Ctrl+c"`, `"q"`, `"Shift+Tab"`
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

const DEFAULT_GROUP = '';

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
