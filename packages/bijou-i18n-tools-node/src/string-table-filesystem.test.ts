import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';
import { parseStringTable } from '@flyingrobots/bijou-i18n-tools';
import {
  createRuntimeCatalogDirectoryLoader,
  readRuntimeCatalogFilesForLocale,
  readStringTableFile,
  writeRuntimeCatalogFiles,
  writeStringTableFile,
} from './index.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bijou-i18n-string-table-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dir) => {
    await rm(dir, { recursive: true, force: true });
  }));
});

describe('i18n string table filesystem workflow', () => {
  it('writes a CSV string table and generated per-locale runtime catalog files', async () => {
    const dir = await makeTempDir();
    const table = parseStringTable([
      'namespace,id,kind,sourceLocale,sourceValueKind,sourceValue,locale,valueKind,value,status,description',
      'bijou.docs,settings.language,message,en,string,Preferred language,en,string,Preferred language,current,',
      'bijou.docs,settings.language,message,en,string,Preferred language,fr,string,Langue préférée,current,',
      'bijou.docs,settings.language,message,en,string,Preferred language,es,string,Idioma preferido,current,',
    ].join('\n'), 'csv');

    await writeStringTableFile(join(dir, 'strings.csv'), table, 'csv');
    const restored = await readStringTableFile(join(dir, 'strings.csv'));
    await writeRuntimeCatalogFiles(join(dir, 'catalogs'), restored);

    const frCatalogs = await readRuntimeCatalogFilesForLocale(join(dir, 'catalogs'), 'fr');
    const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    runtime.loadCatalogs(frCatalogs);

    expect(restored.rows).toHaveLength(3);
    expect(frCatalogs).toHaveLength(1);
    expect(frCatalogs[0]?.namespace).toBe('bijou.docs');
    expect(frCatalogs[0]?.entries[0]?.values).toEqual({
      en: 'Preferred language',
      fr: 'Langue préférée',
    });
    expect(runtime.t({ namespace: 'bijou.docs', id: 'settings.language' }))
      .toBe('Langue préférée');
  });

  it('loads only the requested locale directory through the runtime loader', async () => {
    const dir = await makeTempDir();
    const table = parseStringTable([
      'namespace,id,kind,sourceLocale,sourceValueKind,sourceValue,locale,valueKind,value,status,description',
      'bijou.docs,title,message,en,string,Docs,en,string,Docs,current,',
      'bijou.docs,title,message,en,string,Docs,fr,string,Documentation,current,',
      'bijou.docs,title,message,en,string,Docs,de,string,Dokumentation,current,',
    ].join('\n'), 'csv');
    await writeRuntimeCatalogFiles(join(dir, 'catalogs'), table);

    const loader = createRuntimeCatalogDirectoryLoader({ rootDir: join(dir, 'catalogs') });
    const runtime = createI18nRuntime({ locale: 'en', direction: 'ltr', loader });
    await runtime.setLocale('de');

    expect(runtime.t({ namespace: 'bijou.docs', id: 'title' })).toBe('Dokumentation');
    expect((await loader('de'))[0]?.entries[0]?.values).toEqual({
      en: 'Docs',
      de: 'Dokumentation',
    });
  });
});
