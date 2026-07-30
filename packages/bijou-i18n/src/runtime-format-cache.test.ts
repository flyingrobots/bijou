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
});
