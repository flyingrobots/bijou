import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

/** How a provenance line should be emphasised when drawn. */
export type ThemeLabProvenanceTone = 'accent' | 'body' | 'muted';

/** One rendered line of provenance for the selected token. */
export interface ThemeLabProvenanceLine {
  readonly text: string;
  readonly tone: ThemeLabProvenanceTone;
  /** Colour to draw as a leading swatch, when the line names a concrete value. */
  readonly swatch?: string;
}

export function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}
