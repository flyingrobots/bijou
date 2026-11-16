import { parseFamilySections } from '../../scripts/design-system-docs-parser.js';
import { readDocumentationFile } from '../../scripts/documentation-corpus.js';
import type { ComponentStory } from './protocol-types.js';

/** Fields of a design-system component family, named as in "Component Families" (book record R52). */
export const DESIGN_FIELDS = [
  'Family', 'Variants', 'Use when', 'Avoid when', 'Content guidance', 'Ownership', 'Graceful lowering', 'Related families',
] as const;
export type DesignField = (typeof DESIGN_FIELDS)[number];

export interface DesignFamily {
  /** The family's name in the design system, for example "Inline status". */
  readonly name: string;
  readonly fields: ReadonlyMap<DesignField, readonly string[]>;
}

const FIELD_LINE = /^- ([A-Za-z][A-Za-z ]+):\s*(.*)$/;
const isField = (value: string): value is DesignField => (DESIGN_FIELDS as readonly string[]).includes(value);

/** Strip Markdown list markers and code ticks, keeping the words. */
const plain = (line: string): string => line.replace(/^\s*-\s+/, '').replace(/`([^`]+)`/g, '$1').trim();

function fieldsOf(lines: readonly string[]): Map<DesignField, string[]> {
  const fields = new Map<DesignField, string[]>();
  let current: string[] | undefined;
  for (const line of lines) {
    const match = FIELD_LINE.exec(line);
    if (match !== null) {
      const name = match[1] ?? '';
      // Fields outside the design vocabulary are dropped.
      current = isField(name) ? [] : undefined;
      if (current !== undefined && isField(name)) fields.set(name, current);
      const inline = plain(match[2] ?? '');
      if (current !== undefined && inline !== '') current.push(inline);
    } else if (current !== undefined && plain(line) !== '') {
      current.push(plain(line));
    }
  }
  return fields;
}

const DOC = new URL('../../docs/design-system/component-families.md', import.meta.url);
const FAMILIES: readonly DesignFamily[] = parseFamilySections(readDocumentationFile(DOC, 'utf8'))
  .map((section) => ({ name: section.title, fields: fieldsOf(section.lines) }));

const functions = (text: string): string[] =>
  [...text.matchAll(/([A-Za-z][A-Za-z0-9]*)\(\)/g)].map((m) => m[1] ?? '').filter((name) => name !== '');

/** How many design-system families a set of stories covers. */
export function coveredFamilies(stories: readonly ComponentStory[]): number {
  return new Set(stories.flatMap((story) => designFamilyFor(story)?.name ?? [])).size;
}

/** The design-system family that documents a story's component: the one naming the most of its functions. */
export function designFamilyFor(story: Pick<ComponentStory, 'title'>): DesignFamily | undefined {
  const names = new Set(functions(story.title));
  let best: { family: DesignFamily; score: number } | undefined;
  for (const family of FAMILIES) {
    const score = functions((family.fields.get('Family') ?? []).join(' ')).filter((name) => names.has(name)).length;
    if (score > (best?.score ?? 0)) best = { family, score };
  }
  return best?.family;
}
