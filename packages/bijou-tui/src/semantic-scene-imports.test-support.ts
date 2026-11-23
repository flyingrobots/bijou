import { dirname, join, normalize } from 'node:path';

/**
 * An `import` or `export` statement with a `from` clause, or a side-effect
 * `import './module.js'`. Group 1 is the clause; group 2 is the specifier.
 */
const specifierPattern =
  /^\s*(?:import|export)\b(?:([^;'"]*?)\bfrom\s*|\s*)['"]([^'"]+)['"]/gmu;

/** One module specifier and the names that its statement imports. */
export interface ImportStatement {
  readonly specifier: string;
  readonly names: readonly string[];
}

export interface ImportGraph {
  readonly files: readonly string[];
  readonly packages: readonly string[];
  readonly packageNames: readonly string[];
}

/** Read the import and export statements of one source file. */
export function collectImports(source: string): readonly ImportStatement[] {
  return [...source.matchAll(specifierPattern)].map(
    ([, clause = '', specifier = '']) => ({
      specifier,
      names: clause.match(/[A-Za-z_]\w*/gu) ?? [],
    }),
  );
}

/**
 * Follow the relative imports of `entry` and collect what they reach.
 * `read` returns the source of a file path relative to the source root.
 */
export function importGraph(
  entry: string,
  read: (file: string) => string,
): ImportGraph {
  const files = new Set<string>();
  const packages = new Set<string>();
  const packageNames = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || files.has(file)) continue;
    files.add(file);
    for (const { specifier, names } of collectImports(read(file))) {
      if (specifier.startsWith('.')) {
        const target = specifier.replace(/\.js$/u, '.ts');
        pending.push(normalize(join(dirname(file), target)));
        continue;
      }
      packages.add(specifier);
      for (const name of names) packageNames.add(name);
    }
  }
  return {
    files: [...files].sort(),
    packages: [...packages].sort(),
    packageNames: [...packageNames].sort(),
  };
}
