import type {
  LocalizationIssue,
  LocalizationStatus,
} from './localization.part01.js';
import { isReference, keyToString } from './runtime-catalog.js';
import type {
  I18nCatalogEntry,
  I18nCatalogKey,
  I18nMissingMessageFormatter,
  RuntimeLocaleState,
} from './runtime-contract.js';

export interface ResolutionContext {
  readonly entries: ReadonlyMap<string, I18nCatalogEntry>;
  readonly state: RuntimeLocaleState;
  readonly fallbackLocale: string;
}

export interface LocalizedResolution {
  readonly status: LocalizationStatus;
  readonly value?: unknown;
  readonly issues: readonly LocalizationIssue[];
}

export function localizationIssue(
  context: ResolutionContext,
  code: LocalizationIssue['code'],
  key: I18nCatalogKey,
  message: string,
): LocalizationIssue {
  return {
    code,
    key,
    locale: context.state.locale,
    fallbackLocale: context.fallbackLocale,
    message,
  };
}

export function resolveLocalizedValue(
  entry: I18nCatalogEntry,
  context: ResolutionContext,
): unknown {
  return resolveLocalizedValueResult(entry, new Set<string>(), context).value;
}

export function resolveLocalizedValueResult(
  entry: I18nCatalogEntry,
  seen: Set<string>,
  context: ResolutionContext,
  missingMessage?: I18nMissingMessageFormatter,
): LocalizedResolution {
  const localized = entry.values[context.state.locale];
  if (localized !== undefined) {
    return resolveCandidate(
      localized, seen, context, 'translated', missingMessage,
    );
  }
  if (
    missingMessage !== undefined
    && context.state.locale !== entry.sourceLocale
    && context.state.locale !== context.fallbackLocale
  ) {
    return {
      status: 'missing',
      value: missingMessage({
        key: entry.key,
        locale: context.state.locale,
        fallbackLocale: context.fallbackLocale,
        sourceLocale: entry.sourceLocale,
        reason: 'missing-locale',
      }),
      issues: [localizationIssue(
        context,
        'missing-locale',
        entry.key,
        `Missing selected-locale value for ${keyToString(entry.key)}`,
      )],
    };
  }
  const candidates = [
    entry.values[entry.sourceLocale],
    entry.values[context.fallbackLocale],
    entry.fallbackValue,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return resolveCandidate(candidate, seen, context, 'fallback', missingMessage);
    }
  }
  return {
    status: 'missing',
    issues: [localizationIssue(
      context,
      'missing-locale',
      entry.key,
      `Missing localized value for ${keyToString(entry.key)}`,
    )],
  };
}

function resolveCandidate(
  candidate: unknown,
  seen: Set<string>,
  context: ResolutionContext,
  status: LocalizationStatus,
  missingMessage?: I18nMissingMessageFormatter,
): LocalizedResolution {
  if (!isReference(candidate)) {
    return { status, value: candidate, issues: [] };
  }
  const refKey = keyToString(candidate.$ref);
  if (seen.has(refKey)) throw new Error(`Cyclic i18n reference: ${refKey}`);
  seen.add(refKey);
  const referencedEntry = context.entries.get(refKey);
  if (referencedEntry === undefined) {
    throw new Error(`Missing i18n reference: ${refKey}`);
  }
  const resolved = resolveLocalizedValueResult(
    referencedEntry,
    seen,
    context,
    missingMessage,
  );
  seen.delete(refKey);
  if (resolved.value === undefined) {
    throw new Error(`Missing i18n reference: ${refKey}`);
  }
  return {
    status: mergeResolutionStatus(status, resolved.status),
    value: resolved.value,
    issues: resolved.issues,
  };
}

function mergeResolutionStatus(
  candidate: LocalizationStatus,
  referenced: LocalizationStatus,
): LocalizationStatus {
  if (candidate === 'missing' || referenced === 'missing') return 'missing';
  if (candidate === 'fallback' || referenced === 'fallback') return 'fallback';
  return 'translated';
}
