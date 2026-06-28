import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DL-019 theme rule selection and inspection', () => {
  it('qualifies vivid selector readability in recipe docs', () => {
    const recipes = readRepoFile('docs/design-system/theme-rule-recipes.md');
    const normalized = recipes.replace(/\s+/g, ' ');

    expect(normalized).toContain(
      '`mostVivid(candidates, options)` chooses the highest-chroma candidate; ' +
      'it is readable only when `against` and `minContrast` are provided.',
    );
    expect(normalized).toContain(
      '`leastVivid(candidates, options)` chooses the lowest-chroma candidate; ' +
      'it uses the same readability rule.',
    );
  });

  it('documents serialized scope data with the runtime discriminant', () => {
    const design = readRepoFile('docs/design/DL-019-theme-rule-selection-and-inspection.md');

    expect(design).toContain('candidates: { kind: "scope", path: "palette" }');
    expect(design).not.toContain('candidates: { scope: "palette" }');
  });
});
