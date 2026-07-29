/**
 * Command palette building block — a filterable, navigable action list.
 *
 * Provides state transformers for filtering, focus, and page navigation,
 * a pure render function with viewport clipping, and a convenience keymap.
 *
 * ```ts
 * // In TEA init:
 * const cpState = createCommandPaletteState(items);
 *
 * // In TEA view:
 * const output = commandPaletteSurface(model.cpState, { width: 60 });
 *
 * // In TEA update:
 * case 'filter':
 *   return [{ ...model, cpState: cpFilter(model.cpState, msg.query) }, []];
 * case 'select':
 *   const selected = cpSelectedItem(model.cpState);
 *   // handle selection...
 * ```
 */

export type { CommandPaletteItem, CommandPaletteOptions, CommandPaletteState, CommandPaletteSurfaceOptions } from './command-palette.part01.js';
export { createCommandPaletteState } from './command-palette.part01.js';
export { cpFilter, cpFocusNext, cpFocusPrev, cpPageDown, cpPageUp, cpSelectedItem } from './command-palette.part02.js';
export { commandPalette, commandPaletteSurface } from './command-palette.part03.js';
export { commandPaletteKeyMap } from './command-palette.part04.js';
