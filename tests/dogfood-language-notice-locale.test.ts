import { describe, expect, it } from 'vitest';
import { createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { createDocsI18nRuntime } from '../examples/docs/app-i18n-runtime.js';
import { localizationSettingsSection } from '../examples/docs/app-settings-localization.js';

function languageNotice(from: string): string {
  const i18n = createDocsI18nRuntime({ locale: from });
  const section = localizationSettingsSection(
    { locale: from },
    createRuntimeLocalizationPort(i18n),
  );
  return section.rows[0]?.feedback?.message ?? '';
}

describe('DOGFOOD language-change notice', () => {
  // Oracle: the four supported locale transitions and their catalog messages.
  it.each([
    ['en', 'Langue définie sur français / Français.'],
    ['fr', 'Idioma establecido en español / Español.'],
    ['es', 'Sprache auf Deutsch gesetzt.'],
    ['de', 'Language set to English.'],
  ])('uses the newly selected language when cycling from %s', (from, expected) => {
    expect(languageNotice(from)).toBe(expected);
  });
});
