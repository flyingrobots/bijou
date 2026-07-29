import type { BindingInfo } from './keybindings.js';
import { formatKeyCombo } from './keybindings.js';
import type { BindingSource, HelpOptions } from './help-types.js';

function filteredBindings(
  source: BindingSource,
  options?: Pick<HelpOptions, 'enabledOnly' | 'groupFilter'>,
): readonly BindingInfo[] {
  const enabledOnly = options?.enabledOnly ?? true;
  const groupFilter = options?.groupFilter?.toLowerCase();
  return source
    .bindings()
    .filter((binding) => !enabledOnly || binding.enabled)
    .filter(
      (binding) =>
        groupFilter === undefined ||
        binding.group.toLowerCase().startsWith(groupFilter),
    );
}

/**
 * Render full, grouped, multi-line help text.
 *
 * @param keymap - Source of key binding information.
 * @param options - Filtering, formatting, title, and fallback-group options.
 * @returns Grouped help text, or an empty string when no binding matches.
 */
export function helpView(keymap: BindingSource, options?: HelpOptions): string {
  const bindings = filteredBindings(keymap, options);
  if (bindings.length === 0) return '';

  const defaultGroupName = options?.defaultGroupName ?? 'General';
  const groups = new Map<string, BindingInfo[]>();
  for (const binding of bindings) {
    const group = binding.group || defaultGroupName;
    const existing = groups.get(group);
    if (existing === undefined) {
      groups.set(group, [binding]);
    } else {
      existing.push(binding);
    }
  }

  const maximumKeyLength = Math.max(
    ...bindings.map((binding) => formatKeyCombo(binding.combo).length),
  );
  const separator = options?.separator ?? '  ';
  const lines: string[] = [];
  if (options?.title) lines.push(options.title, '');
  let first = true;
  for (const [groupName, groupBindings] of groups) {
    if (!first) lines.push('');
    first = false;
    lines.push(groupName);
    for (const binding of groupBindings) {
      const key = formatKeyCombo(binding.combo).padEnd(maximumKeyLength);
      lines.push(`  ${key}${separator}${binding.description}`);
    }
  }
  return lines.join('\n');
}

/**
 * Render enabled key bindings as a single-line summary.
 *
 * @param keymap - Source of key binding information.
 * @param options - Optional enabled-state and group-prefix filters.
 * @returns Key descriptions separated by bullets.
 */
export function helpShort(
  keymap: BindingSource,
  options?: Pick<HelpOptions, 'enabledOnly' | 'groupFilter'>,
): string {
  return filteredBindings(keymap, options)
    .map((binding) => `${formatKeyCombo(binding.combo)} ${binding.description}`)
    .join(' • ');
}

/**
 * Render grouped help for one case-insensitive group prefix.
 *
 * @param keymap - Source of key binding information.
 * @param groupPrefix - Group-name prefix to include.
 * @param options - Remaining help formatting options.
 * @returns Filtered grouped help text.
 */
export function helpFor(
  keymap: BindingSource,
  groupPrefix: string,
  options?: HelpOptions,
): string {
  return helpView(keymap, {
    ...options,
    groupFilter: groupPrefix,
  });
}
