#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DocProblem {
  readonly section: string;
  readonly field?: string;
  readonly message: string;
}

export interface FamilySection {
  readonly title: string;
  readonly lines: readonly string[];
}

const REQUIRED_FIELDS = [
  'Family',
  'Variants',
  'Use when',
  'Avoid when',
  'Content guidance',
  'Ownership',
  'Graceful lowering',
  'Related families',
  'Carbon analogue',
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];

const REQUIRED_LOWERING_MODES = ['rich', 'static', 'pipe', 'accessible'] as const;

export const COMPONENT_FAMILY_DOC = resolve(
  fileURLToPath(new URL('../docs/design-system/component-families.md', import.meta.url)),
);

export function parseFamilySections(markdown: string): readonly FamilySection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: FamilySection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = /^###\s+(.+)$/.exec(line);
    if (match) {
      if (currentTitle != null) {
        sections.push({ title: currentTitle, lines: currentLines });
      }
      currentTitle = match[1]!.trim();
      currentLines = [];
      continue;
    }

    if (currentTitle != null) {
      currentLines.push(line);
    }
  }

  if (currentTitle != null) {
    sections.push({ title: currentTitle, lines: currentLines });
  }

  return sections;
}

function collectFieldBlocks(lines: readonly string[]): Map<RequiredField, readonly string[]> {
  const blocks = new Map<RequiredField, readonly string[]>();
  let currentField: RequiredField | null = null;
  let currentBlock: string[] = [];

  const flush = () => {
    if (currentField != null) {
      blocks.set(currentField, currentBlock);
    }
  };

  for (const line of lines) {
    const match = /^- ([A-Za-z][A-Za-z ]+):\s*(.*)$/.exec(line);
    const maybeField = match?.[1] as RequiredField | undefined;
    if (maybeField && REQUIRED_FIELDS.includes(maybeField)) {
      flush();
      currentField = maybeField;
      currentBlock = [];
      const inline = match?.[2]?.trim() ?? '';
      if (inline.length > 0) currentBlock.push(inline);
      continue;
    }

    if (currentField != null) {
      currentBlock.push(line);
    }
  }

  flush();
  return blocks;
}

function hasSubstantiveContent(lines: readonly string[]): boolean {
  return lines.some((line) => line.trim().length > 0);
}

function validateGracefulLowering(section: string, lines: readonly string[]): DocProblem[] {
  const block = lines.join('\n').toLowerCase();
  const problems: DocProblem[] = [];

  for (const mode of REQUIRED_LOWERING_MODES) {
    if (!block.includes(mode)) {
      problems.push({
        section,
        field: 'Graceful lowering',
        message: `missing "${mode}" lowering guidance`,
      });
    }
  }

  return problems;
}

export function validateComponentFamilyDocs(markdown: string): readonly DocProblem[] {
  const problems: DocProblem[] = [];
  const sections = parseFamilySections(markdown);

  if (sections.length === 0) {
    return [{ section: 'component-families', message: 'no family sections found' }];
  }

  for (const section of sections) {
    const blocks = collectFieldBlocks(section.lines);
    for (const field of REQUIRED_FIELDS) {
      const block = blocks.get(field);
      if (!block) {
        problems.push({
          section: section.title,
          field,
          message: `missing required field "${field}"`,
        });
        continue;
      }

      if (!hasSubstantiveContent(block)) {
        problems.push({
          section: section.title,
          field,
          message: `field "${field}" has no content`,
        });
      }

      if (field === 'Graceful lowering') {
        problems.push(...validateGracefulLowering(section.title, block));
      }
    }
  }

  return problems;
}

export function runDesignSystemDocsPreflight(docPath = COMPONENT_FAMILY_DOC): number {
  const markdown = readFileSync(docPath, 'utf8');
  const problems = validateComponentFamilyDocs(markdown);

  if (problems.length === 0) {
    process.stdout.write(`design-system-docs: ok (${docPath})\n`);
    return 0;
  }

  for (const problem of problems) {
    const field = problem.field ? ` [${problem.field}]` : '';
    process.stderr.write(`design-system-docs: ${problem.section}${field}: ${problem.message}\n`);
  }
  return 1;
}

function main(): void {
  process.exitCode = runDesignSystemDocsPreflight();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
