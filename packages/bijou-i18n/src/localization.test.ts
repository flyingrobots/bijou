import { describe, expect, it } from 'vitest';
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
  freezeLocalizedValue,
  isJsonShapedLocalizedValue,
} from './index.js';

class UnsupportedPayloadClass {
  readonly label = 'class instance';
}

function sparseArrayPayload(): readonly string[] {
  const value = new Array<string>(2);
  value[1] = 'visible';
  return value;
}

function symbolObjectPayload(): object {
  const secretKey = Symbol('secret');
  return { label: 'Symbol', [secretKey]: 'hidden' };
}

function nonEnumerableObjectPayload(): object {
  const value: Record<string, unknown> = { label: 'Hidden' };
  Object.defineProperty(value, 'hidden', {
    enumerable: false,
    value: 'secret',
  });
  return value;
}

function accessorObjectPayload(): object {
  return Object.defineProperty({}, 'label', {
    enumerable: true,
    get() {
      return 'unsafe';
    },
  });
}

function circularObjectPayload(): object {
  const value: Record<string, unknown> = { label: 'Cycle' };
  value.self = value;
  return value;
}

function symbolArrayPayload(): readonly unknown[] {
  const symbolKey = Symbol('array-secret');
  const value = ['visible'] as unknown[] & Record<symbol, unknown>;
  value[symbolKey] = 'hidden';
  return value;
}

function nonEnumerableArrayPayload(): readonly unknown[] {
  const value = ['visible'];
  Object.defineProperty(value, 'hidden', {
    enumerable: false,
    value: 'secret',
  });
  return value;
}

function accessorArrayPayload(): readonly unknown[] {
  const value = ['visible'];
  Object.defineProperty(value, 'hidden', {
    enumerable: true,
    get() {
      return 'secret';
    },
  });
  return value;
}

function namedPropertyArrayPayload(): readonly unknown[] {
  const value = ['visible'] as unknown[] & { hidden?: string };
  value.hidden = 'secret';
  return value;
}

function selfReferentialArrayPayload(): readonly unknown[] {
  const value = ['visible'] as unknown[] & { self?: unknown };
  value.self = value;
  return value;
}

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
    const sparseArray = sparseArrayPayload();
    const symbolArray = symbolArrayPayload();
    const nonEnumerableArray = nonEnumerableArrayPayload();
    const accessorArray = accessorArrayPayload();
    const namedPropertyArray = namedPropertyArrayPayload();
    const selfReferentialArray = selfReferentialArrayPayload();

    expect(() => freezeLocalizedValue(sparseArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(symbolArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(nonEnumerableArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(accessorArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(namedPropertyArray)).toThrow(Error);
    expect(() => freezeLocalizedValue(selfReferentialArray)).toThrow(Error);
  });

  it('reports JSON-shaped payload conformance with a focused matrix', () => {
    const mutablePayload = { label: 'Ready', nested: { values: [1, 2, 3] } };
    const validPayloads = [
      { name: 'undefined', payload: undefined },
      { name: 'null', payload: null },
      { name: 'boolean', payload: true },
      { name: 'number', payload: 3 },
      { name: 'string', payload: 'ready' },
      { name: 'dense array', payload: ['ready', { count: 2 }] },
      { name: 'plain object', payload: mutablePayload },
    ];
    const invalidPayloads = [
      { name: 'function primitive', payload: () => 'unsafe' },
      { name: 'symbol primitive', payload: Symbol('unsafe') },
      { name: 'bigint primitive', payload: 1n },
      { name: 'built-in object', payload: new Date(0) },
      { name: 'class instance', payload: new UnsupportedPayloadClass() },
      { name: 'symbol-keyed object', payload: symbolObjectPayload() },
      { name: 'non-enumerable object', payload: nonEnumerableObjectPayload() },
      { name: 'accessor object', payload: accessorObjectPayload() },
      { name: 'circular object', payload: circularObjectPayload() },
      { name: 'sparse array', payload: sparseArrayPayload() },
      { name: 'symbol-keyed array', payload: symbolArrayPayload() },
      { name: 'non-enumerable array', payload: nonEnumerableArrayPayload() },
      { name: 'accessor array', payload: accessorArrayPayload() },
      { name: 'named-property array', payload: namedPropertyArrayPayload() },
      { name: 'self-referential array', payload: selfReferentialArrayPayload() },
    ];

    for (const { name, payload } of validPayloads) {
      expect(isJsonShapedLocalizedValue(payload), name).toBe(true);
    }
    for (const { name, payload } of invalidPayloads) {
      expect(isJsonShapedLocalizedValue(payload), name).toBe(false);
    }
    expect(Object.isFrozen(mutablePayload)).toBe(false);
    expect(Object.isFrozen(mutablePayload.nested)).toBe(false);
  });

  it('delegates selected-locale list formatting through the port', () => {
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr' });
    const localization = createRuntimeLocalizationPort(runtime);

    expect(localization.formatList(['one', 'two', 'three'])).toBe('one, two, and three');
  });
});
