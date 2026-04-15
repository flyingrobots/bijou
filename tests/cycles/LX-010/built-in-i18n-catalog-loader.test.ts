import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18nRuntimeAsync, ref } from '../../../packages/bijou-i18n/src/index.js';
import { exportCatalogBundle } from '../../../packages/bijou-i18n-tools/src/index.js';
import {
  createCatalogBundleFileLoader,
  writeCatalogBundleFile,
} from '../../../packages/bijou-i18n-tools-node/src/index.js';
import { existsRepoPath, readRepoFile } from '../repo.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bijou-lx-010-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
});

describe('LX-010 built-in i18n catalog loader cycle', () => {
  it('records the loader seam as completed lineage', () => {
    expect(existsRepoPath('docs/method/retro/LX-010-built-in-i18n-catalog-loader.md')).toBe(true);
    expect(existsRepoPath('docs/method/backlog/up-next/LX-010-built-in-i18n-catalog-loader.md')).toBe(false);

    const retro = readRepoFile('docs/method/retro/LX-010-built-in-i18n-catalog-loader.md');
    expect(retro).toContain('createI18nRuntimeAsync()');
    expect(retro).toContain('createCatalogBundleFileLoader()');
  });

  it('loads locale-keyed bundle files through the shipped runtime loader seam', async () => {
    const dir = await makeTempDir();

    await writeCatalogBundleFile(join(dir, 'en.json'), exportCatalogBundle([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Hello',
            translations: {},
          },
          {
            key: { namespace: 'shell', id: 'greeting.resource' },
            kind: 'resource',
            sourceLocale: 'en',
            sourceValue: ref({ namespace: 'shell', id: 'greeting' }),
            translations: {},
          },
        ],
      },
    ]));

    await writeCatalogBundleFile(join(dir, 'fr.json'), exportCatalogBundle([
      {
        namespace: 'shell',
        entries: [
          {
            key: { namespace: 'shell', id: 'greeting' },
            kind: 'message',
            sourceLocale: 'en',
            sourceValue: 'Hello',
            translations: {
              fr: {
                value: 'Bonjour',
                sourceHash: 'unused',
                status: 'current',
              },
            },
          },
          {
            key: { namespace: 'shell', id: 'greeting.resource' },
            kind: 'resource',
            sourceLocale: 'en',
            sourceValue: ref({ namespace: 'shell', id: 'greeting' }),
            translations: {},
          },
        ],
      },
    ]));

    const runtime = await createI18nRuntimeAsync({
      locale: 'en',
      direction: 'ltr',
      loader: createCatalogBundleFileLoader({
        resolvePath: (locale) => join(dir, `${locale}.json`),
      }),
    });

    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello');
    expect(runtime.resource({ namespace: 'shell', id: 'greeting.resource' })).toBe('Hello');

    await runtime.preloadLocale('fr');
    expect(runtime.locale).toBe('en');
    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Hello');

    await runtime.setLocale('fr');
    expect(runtime.locale).toBe('fr');
    expect(runtime.t({ namespace: 'shell', id: 'greeting' })).toBe('Bonjour');
    expect(runtime.resource({ namespace: 'shell', id: 'greeting.resource' })).toBe('Bonjour');
  });
});
