import { describe, expect, it } from 'vitest';
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
  freezeLocalizedValue,
} from './index.js';

describe('LocalizationPort runtime adapter', () => {
  it('returns a structured localized object for translated messages', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'greeting' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Hello {name}' },
        }],
      }],
      catalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'greeting' },
          kind: 'message',
          sourceLocale: 'en',
          values: { fr: 'Bonjour {name}' },
        }],
      }],
    });
    const localization = createRuntimeLocalizationPort(runtime);

    const resolved = localization.resolve<string>({
      key: { namespace: 'shell', id: 'greeting' },
      values: { name: 'Ada' },
    });

    expect(resolved).toMatchObject({
      key: { namespace: 'shell', id: 'greeting' },
      locale: 'fr',
      fallbackLocale: 'en',
      direction: 'ltr',
      kind: 'message',
      status: 'translated',
      value: 'Bonjour Ada',
      issues: [],
    });
    expect(resolved.facts.map((fact) => [fact.kind, fact.key, fact.value])).toEqual([
      ['locale', 'locale', 'fr'],
      ['direction', 'direction', 'ltr'],
      ['localization-status', 'status', 'translated'],
      ['entry-kind', 'kind', 'message'],
    ]);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.issues)).toBe(true);
    expect(Object.isFrozen(resolved.facts)).toBe(true);
  });

  it('reports fallback status when the selected locale omits a translated value', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'ready' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Ready' },
        }],
      }],
      catalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'ready' },
          kind: 'message',
          sourceLocale: 'en',
          values: {},
        }],
      }],
    });

    const resolved = createRuntimeLocalizationPort(runtime).resolve<string>({
      key: { namespace: 'shell', id: 'ready' },
    });

    expect(resolved.status).toBe('fallback');
    expect(resolved.value).toBe('Ready');
    expect(resolved.issues).toEqual([]);
  });

  it('reports missing status with the configured marker when selected-locale data is missing', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      fallbackLocale: 'en',
      missingMessage: ({ key }) => `<missing ${key.namespace}:${key.id}>`,
      fallbackCatalogs: [{
        namespace: 'shell',
        entries: [{
          key: { namespace: 'shell', id: 'ready' },
          kind: 'message',
          sourceLocale: 'en',
          values: { en: 'Ready' },
        }],
      }],
    });

    const resolved = createRuntimeLocalizationPort(runtime).resolve<string>({
      key: { namespace: 'shell', id: 'ready' },
    });

    expect(resolved.status).toBe('missing');
    expect(resolved.value).toBe('<missing shell:ready>');
    expect(resolved.issues).toEqual([{
      code: 'missing-locale',
      key: { namespace: 'shell', id: 'ready' },
      locale: 'fr',
      fallbackLocale: 'en',
      message: 'Missing selected-locale value for shell:ready',
    }]);
  });

  it('returns immutable localized resource objects without string conversion', () => {
    const runtime = createI18nRuntime({
      locale: 'fr',
      direction: 'ltr',
      catalogs: [{
        namespace: 'assets',
        entries: [{
          key: { namespace: 'assets', id: 'logo' },
          kind: 'resource',
          sourceLocale: 'en',
          values: {
            fr: {
              label: 'Logo',
              lines: ['BIJOU'],
            },
          },
        }],
      }],
    });

    const resolved = createRuntimeLocalizationPort(runtime).resolve<{
      readonly label: string;
      readonly lines: readonly string[];
    }>({
      key: { namespace: 'assets', id: 'logo' },
      kind: 'resource',
    });

    expect(resolved.status).toBe('translated');
    expect(resolved.value).toEqual({ label: 'Logo', lines: ['BIJOU'] });
    expect(Object.isFrozen(resolved.value)).toBe(true);
    expect(Object.isFrozen(resolved.value?.lines)).toBe(true);
  });

  it('rejects non-portable localized value shapes deterministically', () => {
    const cyclicValue: Record<string, unknown> = { label: 'Cycle' };
    cyclicValue.self = cyclicValue;
    const secretKey = Symbol('secret');
    const symbolValue = { label: 'Symbol', [secretKey]: 'hidden' };
    const nonEnumerableValue: Record<string, unknown> = { label: 'Hidden' };
    Object.defineProperty(nonEnumerableValue, 'hidden', {
      enumerable: false,
      value: 'secret',
    });
    const accessorValue = Object.defineProperty({}, 'label', {
      enumerable: true,
      get() {
        return 'unsafe';
      },
    });

    expect(() => freezeLocalizedValue(cyclicValue)).toThrow(
      'Localized value contains circular reference at value.self',
    );
    expect(() => freezeLocalizedValue(symbolValue)).toThrow(
      'Localized value contains unsupported symbol property at value',
    );
    expect(() => freezeLocalizedValue(nonEnumerableValue)).toThrow(
      'Localized value contains unsupported non-enumerable property: value.hidden',
    );
    expect(() => freezeLocalizedValue(accessorValue)).toThrow(
      'Localized value contains unsupported accessor property: value.label',
    );
    expect(() => freezeLocalizedValue(new Date(0))).toThrow(
      'Localized value contains unsupported Date at value',
    );
    expect(() => freezeLocalizedValue(() => 'unsafe')).toThrow(
      'Localized value contains unsupported function at value',
    );
    expect(() => freezeLocalizedValue(Symbol('unsafe'))).toThrow(
      'Localized value contains unsupported symbol at value',
    );
    expect(() => freezeLocalizedValue(1n)).toThrow(
      'Localized value contains unsupported bigint at value',
    );
  });

  it('rejects non-portable localized array own properties deterministically', () => {
    const symbolKey = Symbol('array-secret');
    const symbolArray = ['visible'] as unknown[] & Record<symbol, unknown>;
    symbolArray[symbolKey] = 'hidden';

    const nonEnumerableArray = ['visible'];
    Object.defineProperty(nonEnumerableArray, 'hidden', {
      enumerable: false,
      value: 'secret',
    });

    const accessorArray = ['visible'];
    Object.defineProperty(accessorArray, 'hidden', {
      enumerable: true,
      get() {
        return 'secret';
      },
    });

    const namedPropertyArray = ['visible'] as unknown[] & { hidden?: string };
    namedPropertyArray.hidden = 'secret';

    const selfReferentialArray = ['visible'] as unknown[] & { self?: unknown };
    selfReferentialArray.self = selfReferentialArray;

    expect(() => freezeLocalizedValue(symbolArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(nonEnumerableArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(accessorArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(namedPropertyArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(selfReferentialArray)).toThrow(Error);
  });

  it('delegates selected-locale list formatting through the port', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });
    const localization = createRuntimeLocalizationPort(runtime);

    expect(localization.formatList(['one', 'two', 'three'])).toBe('one, two, and three');
  });
});
