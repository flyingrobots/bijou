import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

type InventorySection = {
  readonly title: string;
  readonly entries: readonly string[];
};

const SECTIONS: readonly InventorySection[] = [
  {
    title: 'Current Truth',
    entries: [
      'README.md',
      'docs/README.md',
      'docs/METHOD.md',
      'docs/BEARING.md',
      'docs/VISION.md',
      'docs/system-style-javascript.md',
      'docs/PLAN.md',
      'docs/legends/README.md',
      'docs/BACKLOG/README.md',
      'docs/design/README.md',
      'docs/invariants/README.md',
      'docs/design-system/README.md',
      'docs/CHANGELOG.md',
      'examples/docs/README.md',
    ],
  },
  {
    title: 'Reference Docs',
    entries: [
      'docs/ARCHITECTURE.md',
      'docs/MIGRATING_TO_V4.md',
      'docs/EXAMPLES.md',
      'docs/release.md',
      'docs/WORKFLOW.md',
    ],
  },
  {
    title: 'Historical And Legacy',
    entries: [
      'docs/ROADMAP.md',
      'docs/COMPLETED.md',
      'docs/GRAVEYARD.md',
      'docs/specs/README.md',
      'docs/archive/README.md',
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
