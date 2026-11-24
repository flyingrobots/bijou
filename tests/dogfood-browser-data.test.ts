import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { DOGFOOD_DATA_DIR, dogfoodBrowserData, staleDogfoodBrowserData } from '../scripts/dogfood-browser-data.js';
import { guideTranslation } from '../examples/docs/app-guide-translations.js';

// DOGFOOD imports generated copies of its logo and translated guides. This is
// their drift check: it regenerates them from the files and compares bytes.
const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });

function copyOfGenerated(): URL {
  const root = mkdtempSync(join(tmpdir(), 'dogfood-data-'));
  temporary.push(root);
  cpSync(new URL(`../${DOGFOOD_DATA_DIR}/`, import.meta.url), join(root, DOGFOOD_DATA_DIR), { recursive: true });
  return pathToFileURL(`${root}/`);
}

describe('generated DOGFOOD data', () => {
  it('matches the logo and the translated guides now', () => {
    expect(staleDogfoodBrowserData()).toEqual([]);
  });

  it('holds one entry for every translated guide of every locale', () => {
    const table: unknown = JSON.parse(dogfoodBrowserData().get(`${DOGFOOD_DATA_DIR}/guide-translations.json`) ?? '');
    expect(typeof table === 'object' && table !== null ? Object.keys(table).length : 0).toBeGreaterThan(100);
  });

  it('names a copy that drifted, a missing one and a stray one', () => {
    const root = copyOfGenerated();
    writeFileSync(new URL(`${DOGFOOD_DATA_DIR}/flyingrobotslogo.json`, root), '""\n');
    rmSync(new URL(`${DOGFOOD_DATA_DIR}/guide-translations.json`, root));
    writeFileSync(new URL(`${DOGFOOD_DATA_DIR}/stray.json`, root), '{}\n');
    expect(staleDogfoodBrowserData(root)).toEqual([
      `${DOGFOOD_DATA_DIR}/flyingrobotslogo.json`,
      `${DOGFOOD_DATA_DIR}/guide-translations.json`,
      `${DOGFOOD_DATA_DIR}/stray.json`,
    ]);
  });

  it('finds no translation for a locale or a guide without a file', () => {
    expect(guideTranslation('navigate-dogfood', 'xx')).toBeUndefined();
    expect(guideTranslation('no-such-guide', 'de')).toBeUndefined();
    expect(guideTranslation('navigate-dogfood', 'en')).toBeUndefined();
    expect(guideTranslation('navigate-dogfood', 'de')?.body.length).toBeGreaterThan(0);
  });
});
