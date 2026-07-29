import type { KeyMsg } from './types.js';
import type { KeyCombo } from './keybindings.part01.js';

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
  if (descriptor === '+') {
    return { key: '+', ctrl: false, alt: false, shift: false };
  }

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
    if (mod === undefined) {
      throw new Error(`Missing modifier in key descriptor "${descriptor}"`);
    }
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

  const key = parts.at(-1);

  if (key === undefined || key === '') {
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

export { DEFAULT_GROUP, matches };
