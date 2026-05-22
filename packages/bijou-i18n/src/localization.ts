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
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeLocalizedValue(item))) as Value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return Object.freeze(value);
  }

  const output: Record<string, unknown> = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!('value' in descriptor)) {
      throw new Error(`Localized value contains unsupported accessor property: ${key}`);
    }
    output[key] = freezeLocalizedValue(descriptor.value);
  }

  return Object.freeze(output) as Value;
}
