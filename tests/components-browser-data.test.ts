import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { COMPONENTS_DATA_DIR, staleComponentsBrowserData, storySnippets } from '../scripts/components-browser-data.js';

// The Components library imports generated copies of its snippets and design
// families. This is their drift check: it regenerates them from the story
// sources and the design-system document and compares the committed bytes.
const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });

function copyOfGenerated(): URL {
  const root = mkdtempSync(join(tmpdir(), 'components-data-'));
  temporary.push(root);
  cpSync(new URL(`../${COMPONENTS_DATA_DIR}/`, import.meta.url), join(root, COMPONENTS_DATA_DIR), { recursive: true });
  return pathToFileURL(`${root}/`);
}

describe('generated Components library data', () => {
  it('matches what its sources give now', () => {
    expect(staleComponentsBrowserData()).toEqual([]);
  });

  it('reads the same snippets from a story checked out with CRLF line endings', () => {
    const source = readFileSync(new URL('../examples/docs/stories-story-alert.ts', import.meta.url), 'utf8');
    const lf = storySnippets(source.replace(/\r\n?/gu, '\n'));
    expect(lf?.variants.length).toBeGreaterThan(1);
    expect(storySnippets(source.replace(/\r?\n/gu, '\r\n'))).toEqual(lf);
  });

  it('names a copy that drifted, a missing one and a stray one', () => {
    const root = copyOfGenerated();
    writeFileSync(new URL(`${COMPONENTS_DATA_DIR}/library-snippets.json`, root), '[]\n');
    rmSync(new URL(`${COMPONENTS_DATA_DIR}/component-families.json`, root));
    writeFileSync(new URL(`${COMPONENTS_DATA_DIR}/stray.json`, root), '{}\n');
    expect(staleComponentsBrowserData(root)).toEqual([
      `${COMPONENTS_DATA_DIR}/component-families.json`,
      `${COMPONENTS_DATA_DIR}/library-snippets.json`,
      `${COMPONENTS_DATA_DIR}/stray.json`,
    ]);
  });
});
