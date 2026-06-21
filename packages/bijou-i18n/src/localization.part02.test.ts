import { describe, expect, it } from 'vitest';
import { createI18nRuntime, createRuntimeLocalizationPort, freezeLocalizedValue } from './index.js';

function sparseArrayPayload(): readonly string[] {
  const value = new Array<string>(2);
  value[1] = 'visible';
  return value;
}

function symbolArrayPayload(): readonly unknown[] {
  const symbolKey = Symbol('array-secret');
  const value = ['visible'];
  Reflect.set(value, symbolKey, 'hidden');
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
  const value = ['visible'];
  Reflect.set(value, 'hidden', 'secret');
  return value;
}

function selfReferentialArrayPayload(): readonly unknown[] {
  const value = ['visible'];
  Reflect.set(value, 'self', value);
  return value;
}

describe('LocalizationPort runtime adapter', () => {
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

      const resolved = createRuntimeLocalizationPort(runtime).resolve({
        key: { namespace: 'assets', id: 'logo' },
        kind: 'resource',
      });

      expect(resolved.status).toBe('translated');
      expect(resolved.value).toEqual({ label: 'Logo', lines: ['BIJOU'] });
      if (resolved.value === null || typeof resolved.value !== 'object' || !('lines' in resolved.value)) {
        throw new Error('Expected localized logo resource');
      }
      expect(Object.isFrozen(resolved.value)).toBe(true);
      expect(Object.isFrozen(resolved.value.lines)).toBe(true);
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
});
