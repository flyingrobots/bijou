import type { Binding, BindingInfo, KeyMapGroup } from './keybindings.part01.js';
import type { KeyMap } from './keybindings.part02.js';
import { DEFAULT_GROUP, matches, parseKeyCombo } from './keybindings.part03.js';

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

  /**
   * Normalize a description string or predicate function into a binding filter.
   *
   * @param input - Description string for exact match, or a filter function.
   * @returns A predicate function that tests bindings.
   */
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
