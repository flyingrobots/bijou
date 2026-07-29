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
  'missing-key' | 'missing-locale' | 'kind-mismatch' | 'invalid-message-value';
export interface LocalizationIssue {
  readonly code: LocalizationIssueCode;
  readonly key: I18nCatalogKey;
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly message: string;
}
export type LocalizationFactKind =
  'locale' | 'direction' | 'localization-status' | 'entry-kind';
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
  resolve(request: LocalizationRequest): LocalizedObject;
  formatNumber(value: number): string;
  formatDate(value: Date): string;
  formatTime(value: Date): string;
  formatList(values: readonly string[]): string;
}
export interface RuntimeLocalizationPortSource {
  readonly locale: string;
  readonly direction: I18nDirection;
  localize(request: LocalizationRequest): LocalizedObject;
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
    resolve(request: LocalizationRequest): LocalizedObject {
      return runtime.localize(request);
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
