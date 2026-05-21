import { describe, expect, it } from 'vitest';
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';
import {
  authoringCatalogsFromStringTable,
  exportStringTable,
  parseStringTable,
  runtimeCatalogsByLocaleFromStringTable,
  runtimeCatalogsForLocaleFromStringTable,
  serializeStringTable,
} from './index.js';

describe('i18n string table workflow', () => {
  it('roundtrips authoring catalogs through a CSV string table', () => {
    const table = exportStringTable([
      {
        namespace: 'bijou.docs',
        entries: [
          {
            key: { namespace: 'bijou.docs', id: 'settings.language' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Preferred language',
            translations: {
              fr: {
                value: 'Langue préférée',
                sourceHash: 'old',
                status: 'current',
              },
            },
          },
        ],
      },
    ], ['en', 'fr', 'es']);

    const csv = serializeStringTable(table, 'csv');
    const parsed = parseStringTable(csv, 'csv');
    const catalogs = authoringCatalogsFromStringTable(parsed);

    expect(parsed.rows).toHaveLength(3);
    expect(catalogs[0]?.entries[0]?.sourceValue).toBe('Preferred language');
    expect(catalogs[0]?.entries[0]?.translations.fr?.value).toBe('Langue préférée');
    expect(catalogs[0]?.entries[0]?.translations.es).toBeUndefined();
  });

  it('builds selected-locale runtime catalogs without carrying unrelated translations', () => {
    const table = parseStringTable([
      'namespace,id,kind,sourceLocale,sourceValueKind,sourceValue,locale,valueKind,value,status,description',
      'bijou.docs,settings.language,message,en,string,Preferred language,en,string,Preferred language,current,',
      'bijou.docs,settings.language,message,en,string,Preferred language,fr,string,Langue préférée,current,',
      'bijou.docs,settings.language,message,en,string,Preferred language,es,string,Idioma preferido,current,',
    ].join('\n'), 'csv');

    const catalogs = runtimeCatalogsForLocaleFromStringTable(table, 'fr');
    const entry = catalogs[0]?.entries[0];
    const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    runtime.loadCatalogs(catalogs);

    expect(runtime.t({ namespace: 'bijou.docs', id: 'settings.language' }))
      .toBe('Langue préférée');
    expect(entry?.values).toEqual({
      en: 'Preferred language',
      fr: 'Langue préférée',
    });
  });

  it('groups runtime catalogs by locale and catalog namespace deterministically', () => {
    const table = parseStringTable([
      'namespace,id,kind,sourceLocale,sourceValueKind,sourceValue,locale,valueKind,value,status,description',
      'bijou.shell,settings,message,en,string,Settings,en,string,Settings,current,',
      'bijou.docs,title,message,en,string,Docs,en,string,Docs,current,',
      'bijou.shell,settings,message,en,string,Settings,de,string,Einstellungen,current,',
      'bijou.docs,title,message,en,string,Docs,de,string,Dokumentation,current,',
    ].join('\n'), 'csv');

    const byLocale = runtimeCatalogsByLocaleFromStringTable(table);

    expect(Object.keys(byLocale)).toEqual(['de', 'en']);
    expect(byLocale.de?.map((catalog) => catalog.namespace)).toEqual(['bijou.docs', 'bijou.shell']);
    expect(byLocale.en?.map((catalog) => catalog.namespace)).toEqual(['bijou.docs', 'bijou.shell']);
  });
});
