import type {
  I18nCatalogKey,
  I18nDirection,
  I18nEntryKind,
} from './runtime.js';

export type LocalizationStatus = 'translated' | 'fallback' | 'missing';

export interface LocalizationRequest {
  readonly key: I18nCatalogKey;
  readonly kind?: I18nEntryKind;
  readonly values?: Readonly<Record<string, unknown>>;
}

export type LocalizationIssueCode =
  | 'missing-key'
  | 'missing-locale'
  | 'kind-mismatch'
  | 'invalid-message-value';

export interface LocalizationIssue {
  readonly code: LocalizationIssueCode;
  readonly key: I18nCatalogKey;
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly message: string;
}

export type LocalizationFactKind =
  | 'locale'
  | 'direction'
  | 'localization-status'
  | 'entry-kind';

export interface LocalizationFact {
  readonly kind: LocalizationFactKind;
  readonly key: string;
  readonly value: string;
}

/**
 * Structured localization result returned by a {@link LocalizationPort}.
 *
 * Values are expected to be JSON-shaped boundary payloads: plain objects,
 * arrays, scalars, or nullish values. Symbol-keyed properties, non-enumerable
 * properties, cyclic graphs, class instances, and accessors are outside the
 * portable catalog contract; accessors are rejected when plain objects cross
 * the freeze boundary.
 */
export interface LocalizedObject<Value = unknown> {
  readonly key: I18nCatalogKey;
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly sourceLocale?: string;
  readonly direction: I18nDirection;
  readonly kind: I18nEntryKind;
  readonly status: LocalizationStatus;
  readonly value?: Value;
  readonly issues: readonly LocalizationIssue[];
  readonly facts: readonly LocalizationFact[];
}

export interface LocalizationPort {
  readonly locale: string;
  readonly direction: I18nDirection;
  resolve<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value>;
  formatNumber(value: number): string;
  formatDate(value: Date): string;
  formatTime(value: Date): string;
  formatList(values: readonly string[]): string;
}

export interface RuntimeLocalizationPortSource {
  readonly locale: string;
  readonly direction: I18nDirection;
  localize<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value>;
  formatNumber(value: number, locale: string): string;
  formatDate(value: Date, locale: string): string;
  formatTime(value: Date, locale: string): string;
  formatList(values: readonly string[], locale: string): string;
}

export function createRuntimeLocalizationPort(
  runtime: RuntimeLocalizationPortSource,
): LocalizationPort {
  return Object.freeze({
    get locale() {
      return runtime.locale;
    },
    get direction() {
      return runtime.direction;
    },
    resolve<Value = unknown>(request: LocalizationRequest): LocalizedObject<Value> {
      return runtime.localize<Value>(request);
    },
    formatNumber(value: number): string {
      return runtime.formatNumber(value, runtime.locale);
    },
    formatDate(value: Date): string {
      return runtime.formatDate(value, runtime.locale);
    },
    formatTime(value: Date): string {
      return runtime.formatTime(value, runtime.locale);
    },
    formatList(values: readonly string[]): string {
      return runtime.formatList(values, runtime.locale);
    },
  });
}

export function freezeLocalizedObject<Value>(
  object: LocalizedObject<Value>,
): LocalizedObject<Value> {
  return Object.freeze({
    ...object,
    key: Object.freeze({ ...object.key }),
    value: freezeLocalizedValue(object.value),
    issues: Object.freeze(object.issues.map((issue) => Object.freeze({
      ...issue,
      key: Object.freeze({ ...issue.key }),
    }))),
    facts: Object.freeze(object.facts.map((fact) => Object.freeze({ ...fact }))),
  });
}

/**
 * Deep-freeze a JSON-shaped localized value.
 *
 * This helper intentionally preserves the portable catalog contract rather
 * than arbitrary JavaScript object identity. Plain objects must expose data
 * properties only; accessor-backed plain objects are rejected.
 */
export function freezeLocalizedValue<Value>(value: Value): Value {
  return cloneLocalizedValue(value, 'value', new WeakSet<object>()) as Value;
}

function cloneLocalizedValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): unknown {
  if (value == null || typeof value !== 'object') {
    if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
      throw new Error(`Localized value contains unsupported ${typeof value} at ${path}`);
    }
    return value;
  }

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new Error(`Localized value contains circular reference at ${path}`);
  }
  seen.add(objectValue);

  try {
    return cloneLocalizedObjectValue(value, path, seen);
  } finally {
    seen.delete(objectValue);
  }
}

function cloneLocalizedObjectValue(
  value: object,
  path: string,
  seen: WeakSet<object>,
): unknown {
  if (Array.isArray(value)) {
    validateLocalizedArray(value, path);
    return Object.freeze(value.map((item, index) => cloneLocalizedValue(item, `${path}[${index}]`, seen)));
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Localized value contains unsupported ${objectKind(value)} at ${path}`);
  }

  const output: Record<string, unknown> = {};
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') {
      throw new Error(`Localized value contains unsupported symbol property at ${path}`);
    }

    const descriptor = descriptors[key];
    if (descriptor === undefined) {
      continue;
    }
    const propertyPath = `${path}.${key}`;
    if (!descriptor.enumerable) {
      throw new Error(`Localized value contains unsupported non-enumerable property: ${propertyPath}`);
    }
    if (!('value' in descriptor)) {
      throw new Error(`Localized value contains unsupported accessor property: ${propertyPath}`);
    }
    output[key] = cloneLocalizedValue(descriptor.value, propertyPath, seen);
  }

  return Object.freeze(output);
}

function validateLocalizedArray(value: readonly unknown[], path: string): void {
  const descriptors = Object.getOwnPropertyDescriptors(value);
  let indexedPropertyCount = 0;
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') {
      throw new Error(`Localized value contains unsupported symbol property at ${path}`);
    }

    if (key === 'length') {
      continue;
    }

    const descriptor = descriptors[key];
    if (descriptor === undefined) {
      continue;
    }

    const propertyPath = arrayPropertyPath(path, key);
    if (!descriptor.enumerable) {
      throw new Error(`Localized value contains unsupported non-enumerable property: ${propertyPath}`);
    }
    if (!('value' in descriptor)) {
      throw new Error(`Localized value contains unsupported accessor property: ${propertyPath}`);
    }
    if (!isArrayIndexKey(key)) {
      throw new Error(`Localized value contains unsupported array property: ${propertyPath}`);
    }
    indexedPropertyCount += 1;
  }

  if (indexedPropertyCount !== value.length) {
    throw new Error(`Localized value contains unsupported sparse array at ${path}`);
  }
}

function arrayPropertyPath(path: string, key: string): string {
  return isArrayIndexKey(key) ? `${path}[${key}]` : `${path}.${key}`;
}

function isArrayIndexKey(key: string): boolean {
  if (key === '') {
    return false;
  }
  const index = Number(key);
  return Number.isInteger(index)
    && index >= 0
    && index < 2 ** 32 - 1
    && String(index) === key;
}

function objectKind(value: object): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}
