import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORMATTER } from './runtime-format.js';

describe('default i18n formatter caching', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reuses a number formatter for repeated calls in one locale', () => {
    const OriginalNumberFormat = Intl.NumberFormat;
    let constructions = 0;
    class TestNumberFormat extends OriginalNumberFormat {
      constructor(
        ...args: ConstructorParameters<typeof OriginalNumberFormat>
      ) {
        super(...args);
        constructions += 1;
      }
    }
    vi.stubGlobal('Intl', { ...Intl, NumberFormat: TestNumberFormat });

    DEFAULT_FORMATTER.formatNumber(1, 'en');
    DEFAULT_FORMATTER.formatNumber(2, 'en');
    DEFAULT_FORMATTER.formatNumber(3, 'fr');

    expect(constructions).toBe(2);
  });

  it('follows default time-zone changes for date and time formatting', () => {
    const originalTimeZone = process.env.TZ;
    const value = new Date('2026-01-15T02:00:00.000Z');
    const locale = 'en-US-u-nu-latn';

    try {
      process.env.TZ = 'UTC';
      DEFAULT_FORMATTER.formatDate(value, locale);
      DEFAULT_FORMATTER.formatTime(value, locale);

      process.env.TZ = 'America/New_York';
      expect(DEFAULT_FORMATTER.formatDate(value, locale)).toBe(
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value),
      );
      expect(DEFAULT_FORMATTER.formatTime(value, locale)).toBe(
        new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(value),
      );
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });
});
