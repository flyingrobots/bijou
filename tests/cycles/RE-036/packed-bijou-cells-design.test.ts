import { documentationFileExists as existsSync } from '../../../scripts/documentation-corpus.js';
import { describe, expect, it } from 'vitest';
import { expectClaims, normalized, ROOT } from '../WF-130/roadmap-goalpost-policy.test-support.js';
const DESIGN_PATH =
  'docs/design/RE-036-packed-bijou-cells-surface-adapter.md';
describe('RE-036 packed-bijou-cells/1 Surface adapter design', () => {
  it('locks the fail-closed receipt and byte-exact adapter contract', () => {
    expect(existsSync(`${ROOT}/${DESIGN_PATH}`)).toBe(true);
    const design = normalized(DESIGN_PATH);

    expectClaims(design, [
      'github_issue: 459',
      'parent_issue: 457',
      'status: complete',
      'Legend: [RE - Runtime Engine]',
      '## Current Truth',
      '## Receipt Contract',
      '## Dimension And Byte Laws',
      '## Glyph Laws',
      '## Color And Modifier Laws',
      '## Scene And Focus Laws',
      '## Chroma Laws',
      '## Validation Error Contract',
      '## Surface Adapter Contract',
      '## Tests To Write First',
      '## Acceptance Criteria',
      '`packed-bijou-cells/1`',
      '`bijou-packed-cell-u8x10-le/1`',
      '`unicode-grapheme-side-table/1`',
      '`ui-scene-ir/1`',
      '`Surface`',
      'positive safe integers',
      'Every cell has an owning scene node.',
      'side-table order exactly',
      'No partial receipt or partially created `Surface` escapes a failure.',
      'Invalid dimensions never reach dimension sanitation.',
    ]);
  });
});
