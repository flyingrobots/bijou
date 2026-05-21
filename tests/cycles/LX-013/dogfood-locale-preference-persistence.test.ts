import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  resolveDogfoodInitialLocale,
  resolveDogfoodRuntimeLocale,
  type DogfoodLocalePreferencePort,
} from '../../../examples/docs/locale.js';
import { createNodeDogfoodLocalePreferencePort } from '../../../examples/docs/node-locale.js';

describe('LX-013 DOGFOOD locale preference persistence', () => {
  it('resolves explicit locale before persisted preference and persisted preference before OS locale', () => {
    const preferencePort: DogfoodLocalePreferencePort = {
      readPreferredLocale: () => 'fr',
      writePreferredLocale: () => undefined,
    };
    const localePort = {
      preferredLocale: () => 'de-DE',
    };

    expect(resolveDogfoodInitialLocale({ locale: 'es-MX', localePreferencePort: preferencePort, localePort }).id).toBe('es');
    expect(resolveDogfoodInitialLocale({ localePreferencePort: preferencePort, localePort }).id).toBe('fr');
    expect(resolveDogfoodRuntimeLocale({ localePreferencePort: preferencePort, localePort })).toBe('fr');
  });

  it('writes the selected locale through the preference port when the settings action cycles language', async () => {
    const writes: string[] = [];
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      locale: 'en',
      localePreferencePort: {
        readPreferredLocale: () => undefined,
        writePreferredLocale: (locale) => {
          writes.push(locale);
        },
      },
    });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'cycle-locale' },
      },
    }], { ctx });

    expect(writes).toEqual(['fr']);
    expect((result.model as any).docsModel.pageModels.guides.locale).toBe('fr');
  });

  it('persists normalized locale ids through the Node preference adapter without reading OS locale state', () => {
    const files = new Map<string, string>();
    const madeDirs: string[] = [];
    const adapter = createNodeDogfoodLocalePreferencePort({
      filePath: '/state/bijou/dogfood-locale.json',
      fs: {
        existsSync: (path) => files.has(path),
        readFileSync: (path) => files.get(path) ?? '',
        mkdirSync: (path) => {
          madeDirs.push(path);
        },
        writeFileSync: (path, content) => {
          files.set(path, content);
        },
      },
    });

    expect(adapter.readPreferredLocale()).toBeUndefined();

    adapter.writePreferredLocale('fr-FR');

    expect(madeDirs).toEqual(['/state/bijou']);
    expect(JSON.parse(files.get('/state/bijou/dogfood-locale.json') ?? '{}')).toEqual({ locale: 'fr' });
    expect(adapter.readPreferredLocale()).toBe('fr');
  });
});
