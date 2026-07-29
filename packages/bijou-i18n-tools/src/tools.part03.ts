import {
  type I18nCatalog,
  type I18nCatalogEntry,
} from '@flyingrobots/bijou-i18n';
import {
  type AuthoringCatalog,
  type AuthoringCatalogEntry,
  keyToString,
} from './tools.part01.js';
import { validateAndResolve } from './tools.part02.js';

export function compileCatalogs(
  catalogs: readonly AuthoringCatalog[],
): readonly I18nCatalog[] {
  const entryMap = new Map<string, AuthoringCatalogEntry>();
  for (const catalog of catalogs) {
    for (const entry of catalog.entries) {
      entryMap.set(keyToString(entry.key), entry);
    }
  }

  return catalogs.map((catalog) => ({
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => {
      validateAndResolve(
        entryMap,
        entry.sourceValue,
        new Set<string>([keyToString(entry.key)]),
      );
      for (const translation of Object.values(entry.translations)) {
        validateAndResolve(
          entryMap,
          translation.value,
          new Set<string>([keyToString(entry.key)]),
        );
      }

      const values: Record<string, unknown> = {
        [entry.sourceLocale]: entry.sourceValue,
      };
      for (const [locale, translation] of Object.entries(entry.translations)) {
        values[locale] = translation.value;
      }
      const compiledEntry: I18nCatalogEntry = {
        key: entry.key,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        values,
      };
      return compiledEntry;
    }),
  }));
}
export const PSEUDO_MAP: Readonly<Record<string, string>> = {
  a: 'à',
  b: 'ƀ',
  c: 'ç',
  d: 'đ',
  e: 'ë',
  f: 'ƒ',
  g: 'ğ',
  h: 'ħ',
  i: 'ï',
  j: 'ĵ',
  k: 'ķ',
  l: 'ľ',
  m: 'ɱ',
  n: 'ñ',
  o: 'ø',
  p: 'þ',
  q: 'ʠ',
  r: 'ř',
  s: 'š',
  t: 'ŧ',
  u: 'ü',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ÿ',
  z: 'ž',
  A: 'Å',
  B: 'ß',
  C: 'Ç',
  D: 'Ð',
  E: 'Ë',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ħ',
  I: 'Ï',
  J: 'Ĵ',
  K: 'Ҡ',
  L: 'Ŀ',
  M: 'Ṁ',
  N: 'Ń',
  O: 'Ø',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ř',
  S: 'Š',
  T: 'Ŧ',
  U: 'Ü',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẍ',
  Y: 'Ÿ',
  Z: 'Ž',
};
