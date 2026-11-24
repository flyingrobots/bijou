import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { SourceTree } from './code-dojo-runtime-import-graph.js';

/** Repository-relative path to source text, for an in-memory or on-disk fixture tree. */
export type FixtureFiles = Readonly<Record<string, string>>;

/** A module whose only content is value imports of the given relative specifiers. */
export function importing(...specifiers: readonly string[]): string {
  const lines = specifiers.map((specifier, index) => `import { v${String(index)} } from '${specifier}';`);
  return `${[...lines, 'export const value = 1;'].join('\n')}\n`;
}

export function memoryTree(files: FixtureFiles, order: readonly string[] = Object.keys(files)): SourceTree {
  return { files: order, read: (file) => files[file] ?? '' };
}

/** Writes the files into a fresh Git working tree (untracked), so the command lists them as the repository does. */
export function createSccFixtureRoot(files: FixtureFiles): string {
  const root = mkdtempSync(join(tmpdir(), 'bijou-runtime-scc-'));
  execFileSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore' });
  writeFixtureFiles(root, files);
  return root;
}

export function writeFixtureFiles(root: string, files: FixtureFiles): void {
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
}

export function removeFixtureFile(root: string, file: string): void {
  rmSync(join(root, file), { force: true });
}

export function removeFixtureRoot(root: string): void {
  rmSync(root, { force: true, recursive: true });
}
