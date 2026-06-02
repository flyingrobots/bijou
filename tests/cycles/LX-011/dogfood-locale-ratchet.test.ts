import { describe, expect, it } from 'vitest';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
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

    port.savePreferredLocale?.('fr');

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
        writeText() {},
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

  it('preserves extra DOGFOOD catalog overrides after language cycling', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
      extraI18nCatalogs: [{
        namespace: 'bijou.dogfood',
        entries: [{
          key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Preferred language override', fr: 'Langue sentinelle' },
        }],
      }],
    });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(frameText(result.frames.at(-1)!)).toContain('Langue sentinelle');
  });

  it('refreshes frame page labels from the selected locale after language cycling', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
      extraI18nCatalogs: [{
        namespace: 'bijou.dogfood',
        entries: [
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.guides' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Guides', fr: 'Guides sentinelle' },
          },
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.blocks' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Blocks', fr: 'Blocs sentinelle' },
          },
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.components' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Components', fr: 'Composants sentinelle' },
          },
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.packages' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Packages', fr: 'Paquets sentinelle' },
          },
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.philosophy' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Philosophy', fr: 'Philosophie sentinelle' },
          },
          {
            key: { namespace: 'bijou.dogfood', id: 'docs.page.release' },
            kind: 'message',
            sourceLocale: 'en',
            values: { en: 'Release', fr: 'Publication sentinelle' },
          },
        ],
      }],
    });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Blocs sentinelle');
    expect(text).toContain('Paquets sentinelle');
    expect(text).not.toContain('[Guides]  Components  Blocks');
  });

  it('cycles the preferred language through settings and syncs every DOGFOOD page model', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const savedLocales: string[] = [];
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
      localePort: {
        preferredLocale: () => 'en',
        savePreferredLocale(locale) {
          savedLocales.push(locale);
        },
      },
    });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
    expect(savedLocales).toEqual(['fr']);
  });

  it('keeps locale activation when preference persistence fails', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const attemptedSaves: string[] = [];
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
      localePort: {
        preferredLocale: () => 'en',
        savePreferredLocale(locale) {
          attemptedSaves.push(locale);
          throw new Error('preference store unavailable');
        },
      },
    });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    expect(pageLocales(result.model)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr', 'fr']);
    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
    expect(attemptedSaves).toEqual(['fr']);
  });
});
