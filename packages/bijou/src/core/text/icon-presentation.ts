/** Unicode text presentation selector (VS15). */
export const TEXT_PRESENTATION_SELECTOR = '\uFE0E';

/**
 * Force text presentation for an icon glyph.
 *
 * This keeps first-party status symbols in the text-width lane even in
 * renderers that would otherwise pick emoji presentation and widen them.
 */
export function forceTextPresentation(icon: string): string {
  return `${icon}${TEXT_PRESENTATION_SELECTOR}`;
}
