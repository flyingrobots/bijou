import {
  doctorTheme,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { DOGFOOD_THEME_SAFE_PAIRS } from './dogfood-shell-themes.js';
import { dogfoodLocalizedText } from './localization.js';
import { themeTokenEntries } from './app-theme-token-model.js';

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function dogfoodSafePairSummary(theme: Theme, localization: LocalizationPort | undefined): string {
  const report = doctorTheme(theme, { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
  const passed = Math.max(0, DOGFOOD_THEME_SAFE_PAIRS.length - report.issues.length);
  return dogfoodText(localization, 'themeDiagnostics.safePairs', '{passed}/{total} safe pairs pass', {
    passed,
    total: DOGFOOD_THEME_SAFE_PAIRS.length,
  });
}

export function themeColorReuseSummary(theme: Theme, localization: LocalizationPort | undefined): string {
  const uses = new Map<string, string[]>();
  for (const entry of themeTokenEntries(theme)) {
    if (entry.token !== undefined) {
      const values = entry.token.bg === undefined
        ? [entry.token.hex]
        : [entry.token.hex, entry.token.bg];
      for (const value of values) {
        uses.set(value, [...(uses.get(value) ?? []), entry.path]);
      }
      continue;
    }
    for (const stop of entry.stops ?? []) {
      uses.set(stop, [...(uses.get(stop) ?? []), entry.path]);
    }
  }
  const repeated = Array.from(uses.values()).filter((paths) => new Set(paths).size > 1);
  return dogfoodText(localization, 'themeDiagnostics.colorReuse', '{count} reused colors across {total} unique values', {
    count: repeated.length,
    total: uses.size,
  });
}
