import { describe, expect, it } from 'vitest';
import { DOGFOOD_I18N_CATALOG } from '../../../examples/docs/app.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { DOGFOOD_LOCALE_OPTIONS, resolveDogfoodInitialLocale } from '../../../examples/docs/locale.js';
import { createNodeDogfoodLocalePort } from '../../../examples/docs/node-locale.js';

describe('LX-011 DOGFOOD locale ratchet', () => {
  it('resolves the initial DOGFOOD locale through an injected port before falling back to English', () => {
      expect(resolveDogfoodInitialLocale({
        localePort: { preferredLocale: () => 'fr_FR.UTF-8' },
      }).id).toBe('fr');
      expect(resolveDogfoodInitialLocale({
        locale: 'de-DE',
        localePort: { preferredLocale: () => 'fr_FR.UTF-8' },
      }).id).toBe('de');
      expect(resolveDogfoodInitialLocale({
        localePort: { preferredLocale: () => 'zz-ZZ' },
      }).id).toBe('en');
    });

  it('keeps Node locale discovery behind the DOGFOOD locale port', () => {
      expect(createNodeDogfoodLocalePort({
        LC_ALL: 'es_MX.UTF-8',
        LC_MESSAGES: 'de_DE.UTF-8',
        LANG: 'fr_FR.UTF-8',
      }).preferredLocale()).toBe('es_MX.UTF-8');
      expect(createNodeDogfoodLocalePort({
        LANGUAGE: 'fr:de',
        LANG: 'en_US.UTF-8',
      }).preferredLocale()).toBe('fr');
    });

  it('persists DOGFOOD locale preferences through the Node locale port', () => {
      const writes = new Map<string, string>();
      const port = createNodeDogfoodLocalePort({
        env: { LANG: 'es_MX.UTF-8' },
        preferencePath: '/tmp/bijou-test-locale',
        storage: {
          readText(path) {
            return writes.get(path);
          },
          writeText(path, text) {
            writes.set(path, text);
          },
        },
      });
      expect(port.preferredLocale()).toBe('es_MX.UTF-8');
      void port.savePreferredLocale?.('fr');
      expect(port.preferredLocale()).toBe('fr');
      expect(writes.get('/tmp/bijou-test-locale')).toBe('fr\n');
    });

  it('keeps Node locale discovery best-effort when preference reads fail', () => {
      const port = createNodeDogfoodLocalePort({
        env: { LANG: 'de_DE.UTF-8' },
        preferencePath: '/tmp/bijou-test-locale',
        storage: {
          readText() {
            throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
          },
          writeText: () => undefined,
        },
      });
      expect(port.preferredLocale()).toBe('de_DE.UTF-8');
    });

  it('keeps Node locale preference writes best-effort', () => {
      const port = createNodeDogfoodLocalePort({
        env: { LANG: 'en_US.UTF-8' },
        preferencePath: '/tmp/bijou-test-locale',
        storage: {
          readText() {
            return undefined;
          },
          writeText() {
            throw Object.assign(new Error('read only'), { code: 'EROFS' });
          },
        },
      });
      expect(() => port.savePreferredLocale?.('fr')).not.toThrow();
    });

  it('ratchets the settings language catalog for every supported DOGFOOD locale', () => {
      const entries = new Map(DOGFOOD_I18N_CATALOG.entries.map((entry) => [entry.key.id, entry]));
      for (const locale of DOGFOOD_LOCALE_OPTIONS) {
        const localeEntries = new Map(
          dogfoodI18nCatalogsForLocale(locale.id)[0]?.entries.map((entry) => [entry.key.id, entry]),
        );
        const entry = localeEntries.get(`settings.language.${locale.id}`);
        expect(entry?.values[locale.id]).toEqual(expect.any(String));
        if (locale.id !== 'en') {
          expect(entry?.values.en).toBeUndefined();
        }
      }
      expect(entries.get('settings.section.localization')?.values.en).toBe('Localization');
      expect(dogfoodI18nCatalogsForLocale('fr')[0]?.entries.find(
        (entry) => entry.key.id === 'settings.language.label',
      )?.values.fr).toBe('Langue préférée');
    });

  it('ratchets guide inspector chrome into the DOGFOOD string table', () => {
      const entries = new Map(DOGFOOD_I18N_CATALOG.entries.map((entry) => [entry.key.id, entry]));
      const frEntries = new Map(
        dogfoodI18nCatalogsForLocale('fr')[0]?.entries.map((entry) => [entry.key.id, entry]),
      );
      const esEntries = new Map(
        dogfoodI18nCatalogsForLocale('es')[0]?.entries.map((entry) => [entry.key.id, entry]),
      );
      expect(entries.get('guide.info.title')?.values.en).toBe('guide info');
      expect(frEntries.get('guide.info.summaryTitle')?.values.fr).toBe('Résumé');
      expect(esEntries.get('guide.info.currentPostureTitle')?.values.es).toBe('Postura actual');
      expect(entries.get('guide.info.posture.blocks')?.values.en).toContain('Block authoring');
    });

  it('ratchets Theme Lab and Theme Inspector French labels into the DOGFOOD string table', () => {
      const frEntries = new Map(
        dogfoodI18nCatalogsForLocale('fr')[0]?.entries.map((entry) => [entry.key.id, entry]),
      );
      expect(frEntries.get('docs.page.themes')?.values.fr).toBe('Thèmes');
      expect(frEntries.get('themeInspector.title')?.values.fr).toBe('Inspecteur de thèmes');
      expect(frEntries.get('themeLab.title')?.values.fr).toBe('Laboratoire de thèmes');
    });
});
