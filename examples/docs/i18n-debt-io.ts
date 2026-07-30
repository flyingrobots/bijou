import { existsSync, readFileSync } from 'node:fs';
import type {
  DogfoodI18nDebtInventory,
  DogfoodMarkdownLocalizationInventory,
} from './i18n-debt-contract.js';

export function readRepoFile(path: string): string {
  return readFileSync(repoUrl(path), 'utf8');
}

export function repoFileExists(path: string): boolean {
  return existsSync(repoUrl(path));
}

export function repoUrl(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

export function defaultMarkdownTemplateValues(): Readonly<
  Record<string, string>
> {
  const parsed: unknown = JSON.parse(
    readRepoFile('packages/bijou/package.json'),
  );
  const version =
    typeof parsed === 'object' &&
    parsed != null &&
    !Array.isArray(parsed) &&
    'version' in parsed &&
    typeof parsed.version === 'string'
      ? parsed.version.trim()
      : '';
  return Object.freeze({ BIJOU_VERSION: version });
}

export function uniqueStringList(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

export function normalizeLocalizableText(
  rawValue: string,
): string | undefined {
  const value = rawValue.replace(/\s+/g, ' ').trim();
  if (value === '' || !/[A-Za-z]/.test(value)) return undefined;
  if (/^{{[A-Z0-9_]+}}$/.test(value)) return undefined;
  if (/^--[a-z0-9-]+$/i.test(value)) return undefined;
  if (value.startsWith('.') || value.startsWith('/')) return undefined;
  if (value.startsWith('@') || /^#[0-9a-f]{3,8}$/i.test(value)) {
    return undefined;
  }
  if (/\.(gif|js|json|md|tape|ts|txt)$/i.test(value)) return undefined;
  if (/^[a-z0-9._:/-]+$/i.test(value) && /[._:/-]/.test(value)) {
    return undefined;
  }
  return value;
}

export function freezeInventory(
  inventory: DogfoodI18nDebtInventory,
): DogfoodI18nDebtInventory {
  return Object.freeze({
    entries: Object.freeze(
      inventory.entries.map((entry) => Object.freeze({ ...entry })),
    ),
    bySurface: Object.freeze(
      inventory.bySurface.map((entry) => Object.freeze({ ...entry })),
    ),
    total: inventory.total,
  });
}

export function freezeMarkdownLocalizationInventory(
  inventory: DogfoodMarkdownLocalizationInventory,
): DogfoodMarkdownLocalizationInventory {
  return Object.freeze({
    documents: Object.freeze(
      inventory.documents.map((document) =>
        Object.freeze({ ...document }),
      ),
    ),
    entries: Object.freeze(
      inventory.entries.map((entry) =>
        Object.freeze({
          ...entry,
          candidates: Object.freeze([...entry.candidates]),
        }),
      ),
    ),
    byLocale: Object.freeze(
      inventory.byLocale.map((entry) => Object.freeze({ ...entry })),
    ),
    total: inventory.total,
  });
}
