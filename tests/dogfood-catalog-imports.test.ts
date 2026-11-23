import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DOGFOOD_CATALOG_FILES, dogfoodI18nCatalogsForLocale } from '../examples/docs/i18n/dogfood-catalog.js';

// DOGFOOD imports its generated runtime catalogs instead of listing the
// directory. This holds the import table to the directory that
// `npm run dogfood:i18n:build` writes (and `dogfood:i18n:check` verifies).
const ROOT = new URL('../examples/docs/i18n/catalogs/', import.meta.url);

describe('DOGFOOD runtime catalog imports', () => {
  it('import every catalog file of every locale, and nothing else', () => {
    const onDisk = Object.fromEntries(readdirSync(ROOT).sort().map((locale) => [
      locale, readdirSync(new URL(`${locale}/`, ROOT)).filter((name) => name.endsWith('.json')).sort(),
    ]));
    const imported = Object.fromEntries(Object.entries(DOGFOOD_CATALOG_FILES).sort(([a], [b]) => a.localeCompare(b))
      .map(([locale, files]) => [locale, Object.keys(files).sort()]));
    expect(imported).toEqual(onDisk);
  });

  it('give each call its own copy, and refuse a locale with no catalogs', () => {
    const [first] = dogfoodI18nCatalogsForLocale('fr');
    const [second] = dogfoodI18nCatalogsForLocale('fr');
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first?.entries).not.toBe(second?.entries);
    expect(() => dogfoodI18nCatalogsForLocale('xx')).toThrow('DOGFOOD has no i18n catalogs for locale xx');
  });
});
