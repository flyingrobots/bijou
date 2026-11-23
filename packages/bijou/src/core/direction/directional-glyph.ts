import type { InlineDirection } from './direction.js';

/**
 * Directional glyph pairs that swap under right-to-left layout. ASCII `<`
 * and `>` are deliberately absent: they appear in code, commands and paths,
 * which are never mirrored.
 */
const GLYPH_PAIRS: readonly (readonly [string, string])[] = [
  ['‹', '›'],
  ['«', '»'],
  ['⟨', '⟩'],
  ['◂', '▸'],
  ['◀', '▶'],
  ['◄', '►'],
  ['⏴', '⏵'],
  ['←', '→'],
  ['⇐', '⇒'],
  ['⟵', '⟶'],
  ['⇠', '⇢'],
  ['↤', '↦'],
  ['⇤', '⇥'],
];

const MIRRORED: ReadonlyMap<string, string> = new Map(
  GLYPH_PAIRS.flatMap(([a, b]) => [[a, b], [b, a]] as const),
);

/**
 * Mirror one directional glyph for `direction`.
 *
 * Under `'rtl'`, a known directional glyph (‹ ›, « », ▸ ◂, ▶ ◀, → ←, ⇒ ⇐ and
 * similar) becomes its opposite. Every other glyph, and every glyph under
 * `'ltr'`, is returned unchanged.
 */
export function mirrorGlyph(glyph: string, direction: InlineDirection): string {
  if (direction !== 'rtl') return glyph;
  return MIRRORED.get(glyph) ?? glyph;
}

/**
 * Mirror every directional glyph in a short affordance string such as a
 * separator (`' › '`) or a disclosure marker, keeping character order.
 *
 * Use it for component-owned glyphs only. Never pass user content, code,
 * paths, IDs, commands or URLs through it.
 */
export function mirrorGlyphs(text: string, direction: InlineDirection): string {
  if (direction !== 'rtl') return text;
  return Array.from(text, (glyph) => MIRRORED.get(glyph) ?? glyph).join('');
}
