export interface DogfoodI18nDebtSource {
  readonly surface: string;
  readonly path: string;
  readonly text?: string;
}

export interface DogfoodI18nDebtEntry {
  readonly surface: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly value: string;
}

export interface DogfoodI18nDebtSurfaceCount {
  readonly surface: string;
  readonly count: number;
}

export interface DogfoodI18nDebtSourceExclusion {
  readonly path: string;
  readonly reason: string;
}

export interface DogfoodI18nDebtInventory {
  readonly entries: readonly DogfoodI18nDebtEntry[];
  readonly bySurface: readonly DogfoodI18nDebtSurfaceCount[];
  readonly total: number;
}

export interface DogfoodI18nDebtBaseline {
  readonly total: number;
  readonly bySurface: Readonly<Record<string, number>>;
}

export interface DogfoodI18nDebtRatchetResult {
  readonly ok: boolean;
  readonly total: number;
  readonly baseline: DogfoodI18nDebtBaseline;
  readonly violations: readonly string[];
}

export interface DogfoodMarkdownLocalizationDocument {
  readonly surface: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly reader: 'readMarkdownDoc' | 'readMarkdownDocExcerpt';
}

export interface DogfoodMarkdownLocalizationEntry {
  readonly surface: string;
  readonly path: string;
  readonly locale: string;
  readonly line: number;
  readonly column: number;
  readonly candidates: readonly string[];
}

export interface DogfoodMarkdownLocalizationLocaleCount {
  readonly locale: string;
  readonly count: number;
}

export interface DogfoodMarkdownLocalizationInventory {
  readonly documents: readonly DogfoodMarkdownLocalizationDocument[];
  readonly entries: readonly DogfoodMarkdownLocalizationEntry[];
  readonly byLocale: readonly DogfoodMarkdownLocalizationLocaleCount[];
  readonly total: number;
}

export interface DogfoodMarkdownLocalizationBaseline {
  readonly total: number;
  readonly byLocale: Readonly<Record<string, number>>;
}

export interface DogfoodMarkdownLocalizationRatchetResult {
  readonly ok: boolean;
  readonly total: number;
  readonly baseline: DogfoodMarkdownLocalizationBaseline;
  readonly violations: readonly string[];
}

export interface DogfoodMarkdownLocalizationSpec {
  readonly sourceLocale?: string;
  readonly locales?: readonly string[];
  readonly localizedPaths: Readonly<Record<string, string>>;
}

export type DogfoodMarkdownFileReader = (path: string) => string;
