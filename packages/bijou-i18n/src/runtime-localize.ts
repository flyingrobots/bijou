import type {
  LocalizedObject,
  LocalizationRequest,
} from './localization.part01.js';
import { freezeLocalizedObject } from './localization.part02.js';
import { keyToString } from './runtime-catalog.js';
import type {
  I18nMissingMessageFormatter,
} from './runtime-contract.js';
import { interpolate } from './runtime-format.js';
import {
  localizationIssue,
  resolveLocalizedValueResult,
  type ResolutionContext,
} from './runtime-resolution.js';

export function localizeRequest(
  request: LocalizationRequest,
  context: ResolutionContext,
  missingMessage?: I18nMissingMessageFormatter,
): LocalizedObject {
  const entry = context.entries.get(keyToString(request.key));
  const kind = request.kind ?? entry?.kind ?? 'message';
  const facts = [
    { kind: 'locale' as const, key: 'locale', value: context.state.locale },
    {
      kind: 'direction' as const,
      key: 'direction',
      value: context.state.direction,
    },
  ];
  if (entry === undefined) {
    const issue = localizationIssue(
      context,
      'missing-key',
      request.key,
      `Missing i18n key: ${keyToString(request.key)}`,
    );
    const value = kind === 'message' && missingMessage !== undefined
      ? interpolate(missingMessage({
        key: request.key,
        locale: context.state.locale,
        fallbackLocale: context.fallbackLocale,
        reason: 'missing-key',
      }), request.values ?? {})
      : undefined;
    return freezeLocalizedObject({
      key: request.key,
      locale: context.state.locale,
      fallbackLocale: context.fallbackLocale,
      direction: context.state.direction,
      kind,
      status: 'missing',
      value,
      issues: [issue],
      facts: [
        ...facts,
        { kind: 'localization-status', key: 'status', value: 'missing' },
        { kind: 'entry-kind', key: 'kind', value: kind },
      ],
    });
  }
  if (request.kind !== undefined && entry.kind !== request.kind) {
    const issue = localizationIssue(
      context,
      'kind-mismatch',
      request.key,
      `Expected ${request.kind} entry for ${keyToString(request.key)}`
        + ` but found ${entry.kind}`,
    );
    return freezeLocalizedObject({
      key: request.key,
      locale: context.state.locale,
      fallbackLocale: context.fallbackLocale,
      sourceLocale: entry.sourceLocale,
      direction: context.state.direction,
      kind: entry.kind,
      status: 'missing',
      issues: [issue],
      facts: [
        ...facts,
        { kind: 'localization-status', key: 'status', value: 'missing' },
        { kind: 'entry-kind', key: 'kind', value: entry.kind },
      ],
    });
  }
  const resolved = resolveLocalizedValueResult(
    entry,
    new Set<string>(),
    context,
    entry.kind === 'message' ? missingMessage : undefined,
  );
  let value = resolved.value;
  const issues = [...resolved.issues];
  if (entry.kind === 'message' && value !== undefined) {
    if (typeof value !== 'string') {
      issues.push(localizationIssue(
        context,
        'invalid-message-value',
        request.key,
        `Resolved message for ${keyToString(request.key)} was not a string`,
      ));
      value = undefined;
    } else {
      value = interpolate(value, request.values ?? {});
    }
  }
  const status = issues.some(
    (issue) => issue.code === 'invalid-message-value',
  ) ? 'missing' : resolved.status;
  return freezeLocalizedObject({
    key: request.key,
    locale: context.state.locale,
    fallbackLocale: context.fallbackLocale,
    sourceLocale: entry.sourceLocale,
    direction: context.state.direction,
    kind: entry.kind,
    status,
    value,
    issues,
    facts: [
      ...facts,
      { kind: 'localization-status', key: 'status', value: status },
      { kind: 'entry-kind', key: 'kind', value: entry.kind },
    ],
  });
}
