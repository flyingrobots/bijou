import { parseFamilySections } from './design-system-docs-parser.js';

export interface DocProblem {
  readonly section: string;
  readonly field?: string;
  readonly message: string;
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
const REQUIRED_FIELD_NAMES: readonly string[] = REQUIRED_FIELDS;
const REQUIRED_LOWERING_MODES = [
  'rich',
  'static',
  'pipe',
  'accessible',
] as const;

function collectFieldBlocks(
  lines: readonly string[],
): Map<RequiredField, readonly string[]> {
  const blocks = new Map<RequiredField, readonly string[]>();
  let currentField: RequiredField | null = null;
  let currentBlock: string[] = [];
  const flush = () => {
    if (currentField != null) blocks.set(currentField, currentBlock);
  };

  for (const line of lines) {
    const match = /^- ([A-Za-z][A-Za-z ]+):\s*(.*)$/.exec(line);
    const maybeField = requiredField(match?.[1]);
    if (maybeField !== undefined) {
      flush();
      currentField = maybeField;
      currentBlock = [];
      const inline = match?.[2]?.trim() ?? '';
      if (inline.length > 0) currentBlock.push(inline);
      continue;
    }
    if (currentField != null) currentBlock.push(line);
  }

  flush();
  return blocks;
}

function requiredField(value: string | undefined): RequiredField | undefined {
  return value !== undefined && isRequiredField(value) ? value : undefined;
}

function isRequiredField(value: string): value is RequiredField {
  return REQUIRED_FIELD_NAMES.includes(value);
}

function hasSubstantiveContent(lines: readonly string[]): boolean {
  return lines.some((line) => line.trim().length > 0);
}

function validateGracefulLowering(
  section: string,
  lines: readonly string[],
): DocProblem[] {
  const block = lines.join('\n').toLowerCase();
  return REQUIRED_LOWERING_MODES.filter((mode) => !block.includes(mode)).map(
    (mode) => ({
      section,
      field: 'Graceful lowering',
      message: `missing "${mode}" lowering guidance`,
    }),
  );
}

export function validateComponentFamilyDocs(
  markdown: string,
): readonly DocProblem[] {
  const problems: DocProblem[] = [];
  const sections = parseFamilySections(markdown);
  if (sections.length === 0) {
    return [
      {
        section: 'component-families',
        message: 'no family sections found',
      },
    ];
  }

  for (const section of sections) {
    const blocks = collectFieldBlocks(section.lines);
    for (const field of REQUIRED_FIELDS) {
      const block = blocks.get(field);
      if (block === undefined) {
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
