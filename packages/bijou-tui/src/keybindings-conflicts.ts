import type { BindingInfo, KeyCombo } from './keybindings.part01.js';
import { formatKeyCombo } from './keybindings.part03.js';

/** A named set of bindings to check for collisions. */
export interface KeyBindingSource {
  /** Where these bindings come from, e.g. `frame` or a page id. */
  readonly source: string;
  /** The bindings that layer registers. */
  readonly bindings: readonly BindingInfo[];
}

/** One claim on a key combo. */
export interface KeyBindingClaim {
  readonly source: string;
  readonly description: string;
  readonly enabled: boolean;
}

/** A key combo claimed by more than one binding. */
export interface KeyBindingConflict {
  /** Human-readable combo, e.g. `]` or `ctrl+p`. */
  readonly combo: string;
  /** Every binding claiming it, in registration order. The first one wins. */
  readonly claims: readonly KeyBindingClaim[];
}

function comboKey(combo: KeyCombo): string {
  return [
    combo.key,
    combo.ctrl ? 'c' : '-',
    combo.alt ? 'a' : '-',
    combo.shift ? 's' : '-',
  ].join('|');
}

/**
 * Find every key combo claimed more than once across the given layers.
 *
 * Key handling resolves to the first match, so a second claim on the same
 * combo is silently dead rather than an error — which is why these go
 * unnoticed. The check covers duplicates inside one layer as well as
 * collisions between layers; pass a single source to check a keymap against
 * itself, or several to check a page against the frame it runs inside.
 *
 * Disabled bindings are still reported. A binding that is disabled now can be
 * enabled later, and the collision is a property of the registration rather
 * than of the current runtime state.
 *
 * Conflicts are returned in first-claim order so output is stable enough to
 * assert on.
 */
export function findKeyBindingConflicts(
  sources: readonly KeyBindingSource[],
): readonly KeyBindingConflict[] {
  const claimsByCombo = new Map<string, { combo: KeyCombo, claims: KeyBindingClaim[] }>();

  for (const { source, bindings } of sources) {
    for (const binding of bindings) {
      const key = comboKey(binding.combo);
      const entry = claimsByCombo.get(key) ?? { combo: binding.combo, claims: [] };
      entry.claims.push({
        source,
        description: binding.description,
        enabled: binding.enabled,
      });
      claimsByCombo.set(key, entry);
    }
  }

  return [...claimsByCombo.values()]
    .filter((entry) => entry.claims.length > 1)
    .map((entry) => ({
      combo: formatKeyCombo(entry.combo),
      claims: entry.claims,
    }));
}

/**
 * Render a conflict as a single warning line.
 *
 * Names the winner explicitly, because "these two collide" leaves a reader to
 * work out which one they actually get. The winner is the first claim in the
 * order the sources were passed in, which is the caller's dispatch order —
 * pass layers in the order they are consulted and the line is accurate.
 */
export function describeKeyBindingConflict(conflict: KeyBindingConflict): string {
  const [winner, ...shadowed] = conflict.claims;
  if (winner === undefined) return '';
  const losers = shadowed
    .map((claim) => `"${claim.description}" (${claim.source})`)
    .join(', ');
  return `Key ${conflict.combo} is bound more than once: `
    + `"${winner.description}" (${winner.source}) is checked first; ${losers} never fires.`;
}
