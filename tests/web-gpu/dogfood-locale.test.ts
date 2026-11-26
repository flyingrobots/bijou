import { describe, expect, it } from 'vitest';
import { createBrowserDogfoodLocalePort } from '../../examples/web-gpu/src/dogfood/browser-locale.js';
import { resolveDogfoodLocale, type DogfoodLocalePort } from '../../examples/docs/locale.js';

// The page's locale port: the browser's language until the reader chooses,
// then the choice, held in the port and nowhere else.
describe('the browser DOGFOOD locale port', () => {
  it('starts from the first language the browser prefers', () => {
    const port: DogfoodLocalePort = createBrowserDogfoodLocalePort({ languages: ['fr-CA', 'en'], language: 'fr-CA' });
    expect(port.preferredLocale()).toBe('fr-CA');
    expect(resolveDogfoodLocale(port.preferredLocale()).id).toBe('fr');
  });

  it('falls back to the single language when the list is empty', () => {
    expect(createBrowserDogfoodLocalePort({ languages: [], language: 'de-AT' }).preferredLocale()).toBe('de-AT');
  });

  it('keeps the reader\'s choice over the browser language, per port', () => {
    const first = createBrowserDogfoodLocalePort({ languages: ['en'], language: 'en' });
    const second = createBrowserDogfoodLocalePort({ languages: ['en'], language: 'en' });
    first.savePreferredLocale('es');
    expect(first.preferredLocale()).toBe('es');
    expect(second.preferredLocale()).toBe('en');
  });

  it('resolves a language DOGFOOD does not ship to its default', () => {
    const port = createBrowserDogfoodLocalePort({ languages: ['ja'], language: 'ja' });
    expect(resolveDogfoodLocale(port.preferredLocale()).id).toBe('en');
  });
});
