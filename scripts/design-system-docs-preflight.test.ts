import { readDocumentationFile as readFileSync } from './documentation-corpus.js';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseFamilySections,
  validateComponentFamilyDocs,
} from './design-system-docs-preflight.js';

const COMPLETE_SECTION = `### Example Family

- Family: \`example()\`
- Variants:
  - semantic
- Use when:
  - when the example applies
- Avoid when:
  - when a different component is more honest
- Content guidance:
  - keep labels concise and stateful
- Ownership:
  - core
- Graceful lowering:
  - rich: keep the richer interaction visible
  - static: preserve the same meaning without fake interactivity
  - pipe: lower to plain text output
  - accessible: linearize the content explicitly
- Related families:
  - \`other()\`
`;

const REPO_ROOT = resolve(import.meta.dirname, '..');

function readRepoFile(path: string): string {
  return readFileSync(resolve(REPO_ROOT, path), 'utf8');
}

describe('design-system docs preflight', () => {
  it('finds component family sections', () => {
    const sections = parseFamilySections(`# Title\n\n${COMPLETE_SECTION}`);
    expect(sections.map((section) => section.title)).toEqual(['Example Family']);
  });

  it('passes a structurally complete family section', () => {
    expect(validateComponentFamilyDocs(`# Title\n\n${COMPLETE_SECTION}`)).toEqual([]);
  });

  it('requires exactly the R52 family fields', () => {
    const problems = validateComponentFamilyDocs('### Example Family\n');
    expect(problems.map((problem) => problem.field)).toEqual([
      'Family',
      'Variants',
      'Use when',
      'Avoid when',
      'Content guidance',
      'Ownership',
      'Graceful lowering',
      'Related families',
    ]);
  });

  it('does not reject an entry that still carries an extra legacy field', () => {
    const markdown = `# Title\n\n${COMPLETE_SECTION}- Legacy note:\n  - anything\n`;
    expect(validateComponentFamilyDocs(markdown)).toEqual([]);
  });

  it('fails when a required field is missing', () => {
    const markdown = `# Title\n\n${COMPLETE_SECTION.replace('- Content guidance:\n  - keep labels concise and stateful\n', '')}`;
    expect(validateComponentFamilyDocs(markdown)).toContainEqual({
      section: 'Example Family',
      field: 'Content guidance',
      message: 'missing required field "Content guidance"',
    });
  });

  it('fails when graceful lowering misses an interaction mode', () => {
    const markdown = `# Title\n\n${COMPLETE_SECTION.replace('  - accessible: linearize the content explicitly\n', '')}`;
    expect(validateComponentFamilyDocs(markdown)).toContainEqual({
      section: 'Example Family',
      field: 'Graceful lowering',
      message: 'missing "accessible" lowering guidance',
    });
  });

  it('documents the expanded table variant anywhere table variants are enumerated', () => {
    expect(readRepoFile('docs/design-system/component-families.md'))
      .toContain('table({ variant: "expanded" })');
    expect(readRepoFile('docs/design-system/patterns.md'))
      .toContain('variant: "expanded"');
    expect(readRepoFile('packages/bijou/GUIDE.md'))
      .toContain('`expanded`');
  });
});
