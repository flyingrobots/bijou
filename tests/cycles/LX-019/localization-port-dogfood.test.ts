import { describe, expect, it } from 'vitest';
import type {
  I18nCatalogKey,
  LocalizedObject,
  LocalizationPort,
  LocalizationRequest,
} from '@flyingrobots/bijou-i18n';
import {
  dogfoodLocalizedText,
  formatLocalizedList,
} from '../../../examples/docs/localization.js';

function localizedObject<Value>(
  key: I18nCatalogKey,
  value: Value,
): LocalizedObject<Value> {
  return Object.freeze({
    key,
    locale: 'fr',
    fallbackLocale: 'en',
    direction: 'ltr',
    kind: 'message',
    status: 'translated',
    value,
    issues: Object.freeze([]),
    facts: Object.freeze([]),
  });
}

describe('LX-019 DOGFOOD localization port usage', () => {
  it('resolves DOGFOOD text through a LocalizationPort', () => {
    const requests: LocalizationRequest[] = [];
    const localization: LocalizationPort = {
      locale: 'fr',
      direction: 'ltr',
      resolve<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
        requests.push(request);
        return localizedObject(request.key, `value:${request.key.id}:${request.values?.name ?? ''}`) as LocalizedObject<Value>;
      },
      formatNumber(value) {
        return String(value);
      },
      formatDate(value) {
        return value.toISOString();
      },
      formatTime(value) {
        return value.toISOString();
      },
      formatList(values) {
        return values.join(' / ');
      },
    };

    expect(dogfoodLocalizedText(localization, 'example.title', 'Example {name}', { name: 'Ada' }))
      .toBe('value:example.title:Ada');
    expect(requests).toEqual([{
      key: { namespace: 'bijou.dogfood', id: 'example.title' },
      values: { name: 'Ada' },
    }]);
    expect(formatLocalizedList(localization, ['un', 'deux'])).toBe('un / deux');
  });

  it('falls back when localized list formatting fails', () => {
    const localization: LocalizationPort = {
      locale: 'fr',
      direction: 'ltr',
      resolve<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
        return localizedObject(request.key, undefined) as LocalizedObject<Value>;
      },
      formatNumber(value) {
        return String(value);
      },
      formatDate(value) {
        return value.toISOString();
      },
      formatTime(value) {
        return value.toISOString();
      },
      formatList() {
        throw new Error('formatter unavailable');
      },
    };

    expect(formatLocalizedList(localization, ['un', 'deux'])).toBe('un, deux');
  });

  it('does not hide localization port failures behind fallback copy', () => {
    const localization: LocalizationPort = {
      locale: 'fr',
      direction: 'ltr',
      resolve<Value = unknown>(): LocalizedObject<Value> {
        throw new Error('localization adapter unavailable');
      },
      formatNumber(value) {
        return String(value);
      },
      formatDate(value) {
        return value.toISOString();
      },
      formatTime(value) {
        return value.toISOString();
      },
      formatList(values) {
        return values.join(' / ');
      },
    };

    expect(() => dogfoodLocalizedText(localization, 'example.title', 'Example')).toThrow(
      'localization adapter unavailable',
    );
  });
});
