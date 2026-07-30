import { parse as parseYaml } from 'yaml';
import type {
  DogfoodMarkdownFileReader,
  DogfoodMarkdownLocalizationSpec,
} from './i18n-debt-contract.js';
import { uniqueStringList } from './i18n-debt-io.js';

export function readDogfoodMarkdownLocalizationSpec(
  sourcePath: string,
  readFile: DogfoodMarkdownFileReader,
): DogfoodMarkdownLocalizationSpec | undefined {
  let text: string;
  try {
    text = readFile(sourcePath);
  } catch {
    return undefined;
  }
  const yaml = markdownFrontmatterYaml(text);
  if (yaml == null) return undefined;
  const root = objectValue(parseYaml(yaml));
  const dogfood = objectValue(root?.dogfood);
  const localization = objectValue(dogfood?.localization);
  if (localization == null) return undefined;
  return Object.freeze({
    sourceLocale: stringValue(localization.sourceLocale),
    locales: stringListValue(localization.locales),
    localizedPaths: Object.freeze(
      localizedPathMapValue(localization.localized),
    ),
  });
}

function markdownFrontmatterYaml(text: string): string | undefined {
  const withoutBom = text.replace(/^\uFEFF/, '');
  const opening = /^---\r?\n/.exec(withoutBom);
  if (opening == null) return undefined;
  const body = withoutBom.slice(opening[0].length);
  const closingIndex = body.search(/\r?\n---[ \t]*(?:\r?\n|$)/);
  return closingIndex === -1 ? undefined : body.slice(0, closingIndex);
}

function localizedPathMapValue(
  value: unknown,
): Record<string, string> {
  const paths: Record<string, string> = {};
  const localized = objectValue(value);
  if (localized == null) return paths;
  for (const [locale, rawPath] of Object.entries(localized)) {
    const path = localizedPathValue(rawPath);
    if (path != null) paths[locale] = path;
  }
  return paths;
}

function localizedPathValue(value: unknown): string | undefined {
  return stringValue(value) ?? stringValue(objectValue(value)?.path);
}

function stringListValue(
  value: unknown,
): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value
    .map(stringValue)
    .filter((entry): entry is string => entry != null);
  return strings.length === 0 ? undefined : uniqueStringList(strings);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function objectValue(
  value: unknown,
): Record<string, unknown> | undefined {
  if (
    typeof value !== 'object' ||
    value == null ||
    Array.isArray(value)
  ) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(value));
}
