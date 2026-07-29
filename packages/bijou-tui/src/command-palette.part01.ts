import type { BijouContext } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single item in the command palette. */
export interface CommandPaletteItem {
  /** Unique identifier for the command. */
  readonly id: string;
  /** Display label shown in the list. */
  readonly label: string;
  /** Optional description displayed after the label. */
  readonly description?: string;
  /** Optional category shown in brackets before the label. */
  readonly category?: string;
  /** Optional keyboard shortcut hint displayed at the end. */
  readonly shortcut?: string;
  /** Optional hidden text included in filtering but not rendered. */
  readonly searchText?: string;
}

/** Immutable state for the command palette widget. */
export interface CommandPaletteState {
  /** All registered command items (unfiltered). */
  readonly items: readonly CommandPaletteItem[];
  /** Items matching the current query. */
  readonly filteredItems: readonly CommandPaletteItem[];
  /** Current filter query string. */
  readonly query: string;
  /** Index of the focused item within `filteredItems`. */
  readonly focusIndex: number;
  /** Vertical scroll offset (first visible item index). */
  readonly scrollY: number;
  /** Maximum number of visible items. */
  readonly height: number;
}

/** Options for rendering the command palette view. */
export interface CommandPaletteOptions {
  /** Total width in columns. */
  readonly width: number;
  /** Show item categories in brackets (default: true). */
  readonly showCategory?: boolean;
  /** Show shortcut hints (default: true). */
  readonly showShortcut?: boolean;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
}

/** Options for rendering the command palette into a `Surface`. */
export interface CommandPaletteSurfaceOptions extends CommandPaletteOptions {
  /** Show a scrollbar track on the results viewport. Default: false. */
  readonly showScrollbar?: boolean;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial command palette state from items and optional height.
 * Focus starts at index 0 with empty query showing all items.
 *
 * @param items - Command items to populate the palette.
 * @param height - Maximum number of visible items (default: 10).
 * @returns Fresh command palette state with all items visible.
 */
export function createCommandPaletteState(
  items: readonly CommandPaletteItem[],
  height = 10,
): CommandPaletteState {
  const h = Math.max(1, height);
  const copied = [...items];
  return {
    items: copied,
    filteredItems: copied,
    query: '',
    focusIndex: 0,
    scrollY: 0,
    height: h,
  };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Score an item field for ranked, case-insensitive substring matching.
 *
 * Earlier fields and stronger positions rank first; hidden search text still
 * participates without being rendered.
 */
function fieldScore(value: string | undefined, query: string, baseScore: number): number | undefined {
  if (value == null) return undefined;
  const haystack = value.toLowerCase();
  const index = haystack.indexOf(query);
  if (index < 0) return undefined;
  if (haystack === query) return baseScore;
  if (index === 0) return baseScore + 1;
  const previous = haystack[index - 1];
  if (previous !== undefined && /\W/.test(previous)) return baseScore + 2;
  return baseScore + 3 + Math.min(index, 100);
}

function queryScore(item: CommandPaletteItem, query: string): number | undefined {
  const q = query.toLowerCase();
  return [
    fieldScore(item.label, q, 0),
    fieldScore(item.category, q, 20),
    fieldScore(item.description, q, 40),
    fieldScore(item.searchText, q, 60),
    fieldScore(item.id, q, 80),
    fieldScore(item.shortcut, q, 100),
  ].reduce<number | undefined>((best, score) => {
    if (score == null) return best;
    return best == null ? score : Math.min(best, score);
  }, undefined);
}

export { queryScore };
