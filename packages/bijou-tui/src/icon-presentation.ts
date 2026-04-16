/** Unicode text presentation selector (VS15). */
export const TEXT_PRESENTATION_SELECTOR = '\uFE0E';

/**
 * Force text presentation for an icon glyph.
 *
 * Bijou TUI uses this for first-party status symbols so terminals that prefer
 * emoji presentation do not widen otherwise text-sized glyphs.
 */
export function forceTextPresentation(icon: string): string {
  return `${icon}${TEXT_PRESENTATION_SELECTOR}`;
}
