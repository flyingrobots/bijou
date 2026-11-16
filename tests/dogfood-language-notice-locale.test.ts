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
  it('is written in the newly selected language (French to Spanish)', () => {
    const message = languageNotice('fr');
    expect(message).toMatch(/^Idioma establecido en /);
    expect(message).toContain('Español');
  });
});
