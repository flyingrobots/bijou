import { describe, expect, it } from 'vitest';
import { createI18nRuntime, createRuntimeLocalizationPort, isJsonShapedLocalizedValue } from './index.js';

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
