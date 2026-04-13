/**
 * Auto-generate help views from registered keybindings.
 *
 * ```ts
 * const kb = createKeyMap<Msg>()
 *   .bind('q', 'Quit', quitMsg)
 *   .group('Navigation', g => g
 *     .bind('j', 'Down', downMsg)
 *     .bind('k', 'Up', upMsg)
 *   );
 *
 * helpView(kb)          // full grouped help
 * helpShort(kb)         // single-line summary
 * helpFor(kb, 'Nav')    // filter by group prefix
 * ```
 */

import { createSurface, parseAnsiToSurface, sanitizePositiveInt, type Surface } from '@flyingrobots/bijou';
import type { BindingInfo } from './keybindings.js';
import { formatKeyCombo } from './keybindings.js';
import { visibleLength } from './viewport.js';

/** Anything that can list its bindings (satisfied by KeyMap). */
export interface BindingSource {
  /** Return all registered key bindings. */
  bindings(): readonly BindingInfo[];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for rendering help views. */
export interface HelpOptions {
  /** Only show enabled bindings (default: true). */
  enabledOnly?: boolean;
  /** Filter to bindings in groups matching this prefix. */
  groupFilter?: string;
  /** Separator between key and description (default: `"  "`). */
  separator?: string;
  /** Title shown at the top (default: none). */
  title?: string;
  /** Label used when a binding does not declare a group (default: `General`). */
  defaultGroupName?: string;
}

/** Options for rendering help into a `Surface`. */
export interface HelpSurfaceOptions extends HelpOptions {
  /** Optional fixed width. Defaults to the widest visible line. */
  width?: number;
  /** Optional fixed height. Defaults to the rendered line count. */
  height?: number;
}

// ---------------------------------------------------------------------------
// Help views
// ---------------------------------------------------------------------------

/**
 * Full help view — grouped, multi-line.
 *
 * ```
 * Navigation
 *   j  Down
 *   k  Up
 *
 * General
 *   q  Quit
 *   ?  Toggle help
 * ```
 *
 * @param keymap - Source of key binding information.
 * @param options - Filtering, formatting, and title options.
 * @returns Multi-line help text grouped by binding group.
 */
export function helpView(keymap: BindingSource, options?: HelpOptions): string {
  const enabledOnly = options?.enabledOnly ?? true;
  const sep = options?.separator ?? '  ';
  const groupFilter = options?.groupFilter;
  const defaultGroupName = options?.defaultGroupName ?? 'General';

  let all = keymap.bindings();
  if (enabledOnly) all = all.filter((b) => b.enabled);
  if (groupFilter !== undefined) {
    all = all.filter((b) =>
      b.group.toLowerCase().startsWith(groupFilter.toLowerCase()),
    );
  }

  if (all.length === 0) return '';

  // Group by group name
  const groups = new Map<string, BindingInfo[]>();
  for (const b of all) {
    const group = b.group || defaultGroupName;
    let list = groups.get(group);
    if (!list) {
      list = [];
      groups.set(group, list);
    }
    list.push(b);
  }

  // Find max key width for alignment
  const allFormatted = all.map((b) => formatKeyCombo(b.combo));
  const maxKeyLen = Math.max(...allFormatted.map((k) => k.length));

  const lines: string[] = [];

  if (options?.title) {
    lines.push(options.title);
    lines.push('');
  }

  let first = true;
  for (const [groupName, bindings] of groups) {
    if (!first) lines.push('');
    first = false;

    lines.push(groupName);

    for (const b of bindings) {
      const key = formatKeyCombo(b.combo).padEnd(maxKeyLen);
      lines.push(`  ${key}${sep}${b.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Full grouped help rendered directly into a `Surface`.
 *
 * Use this when help content is being embedded into a rich TUI view and should
 * stay on the `Surface` path instead of being flattened into a multiline
 * string first.
 *
 * @param keymap - Source of key binding information.
 * @param options - Filtering, formatting, title, and optional surface sizing.
 * @returns A `Surface` containing the rendered grouped help text.
 */
export function helpViewSurface(keymap: BindingSource, options?: HelpSurfaceOptions): Surface {
  return renderHelpSurface(helpView(keymap, options), options);
}

/**
 * Short, single-line help — keys only, no groups.
 *
 * ```
 * q Quit • j Down • k Up • ? Help
 * ```
 *
 * @param keymap - Source of key binding information.
 * @param options - Optional filtering by enabled state or group prefix.
 * @returns Single-line help string with keys and descriptions separated by bullets.
 */
export function helpShort(keymap: BindingSource, options?: Pick<HelpOptions, 'enabledOnly' | 'groupFilter'>): string {
  const enabledOnly = options?.enabledOnly ?? true;
  const groupFilter = options?.groupFilter;

  let all = keymap.bindings();
  if (enabledOnly) all = all.filter((b) => b.enabled);
  if (groupFilter !== undefined) {
    all = all.filter((b) =>
      b.group.toLowerCase().startsWith(groupFilter.toLowerCase()),
    );
  }

  return all
    .map((b) => `${formatKeyCombo(b.combo)} ${b.description}`)
    .join(' • ');
}

/**
 * Single-line help rendered directly into a `Surface`.
 *
 * Use this for shell hints and inline key legends that should remain on the
 * structured surface path. Keep {@link helpShort} for explicit text output or
 * pipe-mode lowering.
 *
 * @param keymap - Source of key binding information.
 * @param options - Optional filtering and fixed surface width.
 * @returns A one-row `Surface` containing the rendered help hint.
 */
export function helpShortSurface(
  keymap: BindingSource,
  options?: Pick<HelpSurfaceOptions, 'enabledOnly' | 'groupFilter' | 'width'>,
): Surface {
  return renderHelpSurface(helpShort(keymap, options), options);
}

/**
 * Filter help to a specific group (convenience wrapper).
 *
 * @param keymap - Source of key binding information.
 * @param groupPrefix - Group name prefix to filter on (case-insensitive).
 * @param options - Additional formatting options forwarded to `helpView` (excluding `groupFilter`, which is set by `groupPrefix`).
 * @returns Filtered multi-line help text.
 */
export function helpFor(keymap: BindingSource, groupPrefix: string, options?: HelpOptions): string {
  return helpView(keymap, { ...options, groupFilter: groupPrefix });
}

/**
 * Group-filtered help rendered directly into a `Surface`.
 *
 * @param keymap - Source of key binding information.
 * @param groupPrefix - Group name prefix to filter on (case-insensitive).
 * @param options - Additional formatting and surface sizing options.
 * @returns A `Surface` containing the filtered help text.
 */
export function helpForSurface(
  keymap: BindingSource,
  groupPrefix: string,
  options?: HelpSurfaceOptions,
): Surface {
  return renderHelpSurface(helpFor(keymap, groupPrefix, options), options);
}

function renderHelpSurface(text: string, options?: Pick<HelpSurfaceOptions, 'width' | 'height'>): Surface {
  const lines = text.length === 0 ? [''] : text.split('\n');
  const contentWidth = Math.max(1, ...lines.map((line) => visibleLength(line)));
  const width = Math.max(contentWidth, sanitizePositiveInt(options?.width, 1));
  const height = sanitizePositiveInt(options?.height, lines.length);

  if (text.length === 0) {
    return createSurface(width, height);
  }

  return parseAnsiToSurface(text, width, height);
}
