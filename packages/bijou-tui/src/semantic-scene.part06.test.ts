import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  collectImports,
  importGraph,
} from './semantic-scene-imports.test-support.js';

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const browserName = /dom|browser/iu;
const domGlobal = /\b(?:document|window)\b/u;

function readSource(file: string): string {
  return readFileSync(join(sourceDirectory, file), 'utf8');
}

describe('semantic scene contract: import graph', () => {
  const graph = importGraph('semantic-scene.ts', readSource);

  it('reaches the controller and imports only the bijou core package', () => {
    expect(graph.files).toContain('semantic-scene-controller.ts');
    expect(graph.packages).toEqual(['@flyingrobots/bijou']);
  });

  it('imports no DOM or browser module or name', () => {
    expect(graph.files.filter((file) => browserName.test(file))).toEqual([]);
    expect(graph.packageNames.filter((name) => browserName.test(name)))
      .toEqual([]);
  });

  it('names no document or window global in any reached file', () => {
    const mentions = graph.files.filter((file) =>
      domGlobal.test(readSource(file)));
    expect(mentions).toEqual([]);
  });
});

describe('semantic scene contract: import scanner', () => {
  it('reads side-effect, multi-line and re-export statements', () => {
    const source = [
      "import './browser-side-effect.js';",
      'import {',
      '  a,',
      "} from '@scope/pkg';",
      "export * from './more.js';",
      "export const empty = '';",
    ].join('\n');

    expect(collectImports(source)).toEqual([
      { specifier: './browser-side-effect.js', names: [] },
      { specifier: '@scope/pkg', names: ['a'] },
      { specifier: './more.js', names: [] },
    ]);
  });

  it('follows a side-effect import to a file that the checks then read', () => {
    const sources = new Map([
      ['entry.ts', "import './browser-side-effect.js';"],
      ['browser-side-effect.ts', "document.title = 'x';"],
    ]);
    const graph = importGraph('entry.ts', (file) => sources.get(file) ?? '');

    expect(graph.files).toEqual(['browser-side-effect.ts', 'entry.ts']);
    expect(graph.files.filter((file) => browserName.test(file)))
      .toEqual(['browser-side-effect.ts']);
    expect(graph.files.filter((file) =>
      domGlobal.test(sources.get(file) ?? ''))).toEqual([
      'browser-side-effect.ts',
    ]);
  });
});
