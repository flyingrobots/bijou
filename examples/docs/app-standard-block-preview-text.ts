import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

export function standardBlockPreviewText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}
