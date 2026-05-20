import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp, DOGFOOD_I18N_CATALOG } from '../../../examples/docs/app.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import {
  DOGFOOD_LOCALE_OPTIONS,
  resolveDogfoodInitialLocale,
} from '../../../examples/docs/locale.js';
import { createNodeDogfoodLocalePort } from '../../../examples/docs/node-locale.js';

const KEY_DOWN = '\x1b[B';
const KEY_ENTER = '\r';
const KEY_F2 = '\x1bOQ';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function pageLocales(model: unknown): readonly string[] {
  const pageModels = (model as {
    readonly docsModel: {
      readonly pageModels: Readonly<Record<string, { readonly locale: string }>>;
    };
  }).docsModel.pageModels;
  return Object.values(pageModels).map((pageModel) => pageModel.locale);
}

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

  it('ratchets the settings language catalog for every supported DOGFOOD locale', () => {
    const entries = new Map(DOGFOOD_I18N_CATALOG.entries.map((entry) => [entry.key.id, entry]));
    for (const locale of DOGFOOD_LOCALE_OPTIONS) {
      const localeEntries = new Map(
        dogfoodI18nCatalogsForLocale(locale.id)[0]?.entries.map((entry) => [entry.key.id, entry]),
      );
      const entry = localeEntries.get(`settings.language.${locale.id}`);
      expect(entry?.values.en).toEqual(expect.any(String));
      expect(entry?.values[locale.id]).toEqual(expect.any(String));
    }
    expect(entries.get('settings.section.localization')?.values.en).toBe('Localization');
    expect(dogfoodI18nCatalogsForLocale('fr')[0]?.entries.find(
      (entry) => entry.key.id === 'settings.language.label',
    )?.values.fr).toBe('Langue préférée');
  });

  it('initializes DOGFOOD pages from the injected locale preference', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      localePort: { preferredLocale: () => 'fr_FR.UTF-8' },
    });

    const result = await runScript(app, [{ key: KEY_F2 }], { ctx });

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
  });

  it('normalizes supported explicit locale aliases before rendering localized settings', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'fr-FR',
    });

    const result = await runScript(app, [{ key: KEY_F2 }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(text).toContain('Langue préférée');
    expect(text).not.toContain('Preferred language');
  });

  it('keeps the language setting renderable when an extra DOGFOOD catalog is partial', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'fr',
      extraI18nCatalogs: [{
        namespace: 'bijou.dogfood',
        entries: [{
          key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Preferred language', fr: 'Langue préférée' },
        }],
      }],
    });

    const result = await runScript(app, [{ key: KEY_F2 }], { ctx });

    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
  });

  it('cycles the preferred language through settings and syncs every DOGFOOD page model', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
    });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
  });
});
