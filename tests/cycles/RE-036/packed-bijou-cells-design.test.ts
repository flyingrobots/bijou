import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  normalized,
  ROOT,
} from '../WF-130/roadmap-goalpost-policy.test-support.js';

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
      'Legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)',
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

  it('makes #459 the active roadmap and bearing target', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');

    expectClaims(roadmap, [
      'The active V8 product pull is [#459](https://github.com/flyingrobots/bijou/issues/459)',
      '[RE-036](./design/RE-036-packed-bijou-cells-surface-adapter.md)',
      '| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 20 | 2 |',
      '| `v10.0.0` | [v10.0.0](https://github.com/flyingrobots/bijou/milestone/10) | 9 | 1 |',
    ]);
    expectClaims(bearing, [
      'The bounded target [#468](https://github.com/flyingrobots/bijou/issues/468) landed through [#474](https://github.com/flyingrobots/bijou/pull/474)',
      'The active v8 product pull is #459',
      '[RE-036](./design/RE-036-packed-bijou-cells-surface-adapter.md)',
    ]);
  });
});
