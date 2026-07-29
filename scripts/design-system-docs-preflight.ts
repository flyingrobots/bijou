#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComponentFamilyDocs } from './design-system-docs-rules.js';

export const COMPONENT_FAMILY_DOC = resolve(
  fileURLToPath(
    new URL('../docs/design-system/component-families.md', import.meta.url),
  ),
);

export function runDesignSystemDocsPreflight(
  docPath = COMPONENT_FAMILY_DOC,
): number {
  const markdown = readFileSync(docPath, 'utf8');
  const problems = validateComponentFamilyDocs(markdown);

  if (problems.length === 0) {
    process.stdout.write(`design-system-docs: ok (${docPath})\n`);
    return 0;
  }

  for (const problem of problems) {
    const field = problem.field ? ` [${problem.field}]` : '';
    process.stderr.write(
      `design-system-docs: ${problem.section}${field}: ${problem.message}\n`,
    );
  }
  return 1;
}

function main(): void {
  process.exitCode = runDesignSystemDocsPreflight();
}

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}

export { parseFamilySections } from './design-system-docs-parser.js';
export type { FamilySection } from './design-system-docs-parser.js';
export { validateComponentFamilyDocs } from './design-system-docs-rules.js';
export type { DocProblem } from './design-system-docs-rules.js';
