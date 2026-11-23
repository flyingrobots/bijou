import { readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const specifierPattern =
  /(?:import|export)([^;]*?)from\s+['"]([^'"]+)['"]/gsu;
const browserName = /dom|browser/iu;

interface ImportGraph {
  readonly files: readonly string[];
  readonly packages: readonly string[];
  readonly packageNames: readonly string[];
}

/** Follow the relative imports of `entry` and collect what they reach. */
function importGraph(entry: string): ImportGraph {
  const files = new Set<string>();
  const packages = new Set<string>();
  const packageNames = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || files.has(file)) continue;
    files.add(file);
    const source = readFileSync(join(sourceDirectory, file), 'utf8');
    for (const [, clause = '', specifier = ''] of source.matchAll(specifierPattern)) {
      if (specifier.startsWith('.')) {
        const target = specifier.replace(/\.js$/u, '.ts');
        pending.push(normalize(join(dirname(file), target)));
        continue;
      }
      packages.add(specifier);
      for (const name of clause.match(/[A-Za-z_]\w*/gu) ?? []) {
        packageNames.add(name);
      }
    }
  }
  return {
    files: [...files].sort(),
    packages: [...packages].sort(),
    packageNames: [...packageNames].sort(),
  };
}

describe('semantic scene contract: import graph', () => {
  const graph = importGraph('semantic-scene.ts');

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
      /\b(?:document|window)\b/u.test(
        readFileSync(join(sourceDirectory, file), 'utf8'),
      ));
    expect(mentions).toEqual([]);
  });
});
