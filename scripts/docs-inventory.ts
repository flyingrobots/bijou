import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface InventorySection {
  readonly title: string;
  readonly entries: readonly string[];
}

const SECTIONS: readonly InventorySection[] = [
  {
    title: 'Current operating documents',
    entries: [
      'README.md',
      'AGENTS.md',
      'docs/README.md',
      'docs/typescript-code-standards.editors-edition.md',
      'docs/code-dojo-exceptions.md',
      'docs/CHANGELOG.md',
      'docs/guides/framed-app-tutorial.md',
    ],
  },
  {
    title: 'Compiled documentation book',
    entries: [
      'docs/book/README.md',
      'docs/book/bijou-designs.pdf',
      'docs/book/bijou-designs.tex',
      'docs/book/source-manifest.json',
      'docs/book/source-corpus.json',
      'docs/book/compiled-source-retirement.json',
    ],
  },
];

for (const section of SECTIONS) {
  console.log(`${section.title}:`);
  for (const entry of section.entries) {
    const absolutePath = resolve(ROOT, entry);
    if (!existsSync(absolutePath)) {
      throw new Error(`Missing documentation inventory entry: ${entry}`);
    }
    console.log(`- ${entry}`);
  }
  console.log('');
}
