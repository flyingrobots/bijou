import { describe, expect, it } from 'vitest';
import type {
  LocalizationPort,
  LocalizationRequest,
} from '@flyingrobots/bijou-i18n';
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
  type LocalizedObject,
} from '@flyingrobots/bijou-i18n';
import {
  dogfoodLocalizedText,
  formatLocalizedList,
} from '../../../examples/docs/localization.js';

function dogfoodLocalizationPort(): LocalizationPort {
  const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
  runtime.loadCatalog({
    namespace: 'bijou.dogfood',
    entries: [{
      key: { namespace: 'bijou.dogfood', id: 'example.title' },
      kind: 'message',
      sourceLocale: 'en',
      values: { fr: 'value:example.title:{name}' },
    }],
  });
  return createRuntimeLocalizationPort(runtime);
}

describe('LX-019 DOGFOOD localization port usage', () => {
  it('resolves DOGFOOD text through a LocalizationPort', () => {
    const requests: LocalizationRequest[] = [];
    const base = dogfoodLocalizationPort();
    const localization: LocalizationPort = {
      locale: base.locale,
      direction: base.direction,
      resolve<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
        requests.push(request);
        return base.resolve<Value>(request);
      },
      formatNumber(value) { return base.formatNumber(value); },
      formatDate(value) { return base.formatDate(value); },
      formatTime(value) { return base.formatTime(value); },
      formatList(values) { return values.join(' / '); },
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
    const base = dogfoodLocalizationPort();
    const localization: LocalizationPort = {
      locale: base.locale,
      direction: base.direction,
      resolve<Value = unknown>(request: LocalizationRequest) { return base.resolve<Value>(request); },
      formatNumber(value) { return base.formatNumber(value); },
      formatDate(value) { return base.formatDate(value); },
      formatTime(value) { return base.formatTime(value); },
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
