/** The part of `navigator` the port reads. */
export interface BrowserLanguages {
  readonly languages: readonly string[];
  readonly language: string;
}

/** DOGFOOD's `DogfoodLocalePort`, stated here so the showcase's strict compile need not read DOGFOOD. */
export interface BrowserLocalePort {
  preferredLocale(): string | undefined;
  savePreferredLocale(locale: string): void;
}

/**
 * DOGFOOD's locale port for a page: the language the browser prefers, until
 * the reader picks one in the app. The choice lives in this port, so in the
 * page and nowhere else; a reload starts again from the browser's language.
 */
export function createBrowserDogfoodLocalePort(browser: BrowserLanguages): BrowserLocalePort {
  let chosen: string | undefined;
  return {
    preferredLocale: () => chosen ?? browser.languages[0] ?? browser.language,
    savePreferredLocale(locale) { chosen = locale; },
  };
}
