import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', 'examples', 'fun');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sources(join(dir, entry.name)) : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : []);
}

const files = sources(ROOT);
const entryFile = join(ROOT, 'main.ts');
const imports = (file: string): string[] =>
  [...readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/gu)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

describe('examples/fun reaches only public packages and, in the terminal entry, Node', () => {
  it('has the terminal entry and at least the contract, the shell and three demos', () => {
    expect(files).toContain(entryFile);
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it('imports no package internal path, in any file', () => {
    const bad = files.flatMap((file) => imports(file).filter((spec) =>
      spec.includes('packages/') || /\/(src|dist)\//u.test(spec)
      || /^@flyingrobots\/[a-z-]+\/(?!adapters\/test)/u.test(spec)));
    expect(bad).toEqual([]);
  });

  it('reaches no Node API outside the terminal entry', () => {
    const bad = files.filter((file) => file !== entryFile).flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      const nodeImport = imports(file).filter((spec) => spec.startsWith('node:') || spec.startsWith('@flyingrobots/bijou-node'));
      const globals = /\b(process|Buffer|require)\b|\bsetTimeout\b|Date\.now|Math\.random|performance\.now/u.test(text) ? ['global'] : [];
      return [...nodeImport, ...globals].map((what) => `${file}: ${what}`);
    });
    expect(bad).toEqual([]);
  });
});
