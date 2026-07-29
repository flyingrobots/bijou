import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  normalized,
  ROOT,
} from '../WF-130/roadmap-goalpost-policy.test-support.js';

const DESIGN_PATH = 'docs/design/DX-050-profunctor-page-inspection.md';

describe('DX-050 Profunctor Page inspection design', () => {
  it('binds the complete cycle contract before implementation', () => {
    expect(existsSync(`${ROOT}/${DESIGN_PATH}`)).toBe(true);
    const design = normalized(DESIGN_PATH);

    expectClaims(design, [
      'github_issue: 468',
      'status: active',
      'Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)',
      '## Sponsor Human',
      '## Sponsor Agent',
      '## Hill',
      '## Playback Questions',
      '## Scope',
      '## Non-Goals',
      '## Accessibility And Assistive Posture',
      '## Localization And Directionality Posture',
      '## Agent Inspectability And Explainability Posture',
      '## Linked Invariants',
      '## Implementation Outline',
      '## Tests To Write First',
      '## Retrospective And Closeout',
      '`profunctor-page/0`',
      '`ui-scene-ir/1`',
      '`Surface`',
      'source map',
      'build manifest',
      '`62` aggregate violations or lower',
    ]);
  });

  it('keeps roadmap and bearing aligned with live tracker truth', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');

    expectClaims(roadmap, [
      'Last synced from GitHub milestone items: 2026-07-29.',
      '| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 15 | 1 |',
      '[#472](https://github.com/flyingrobots/bijou/issues/472)',
      '[#473](https://github.com/flyingrobots/bijou/issues/473)',
      '[DX-050](./design/DX-050-profunctor-page-inspection.md)',
    ]);
    expectClaims(bearing, [
      '`v8.2.0` milestone is quality automation and Method hardening: 15 open and 1 closed milestone items',
      '[DX-050](./design/DX-050-profunctor-page-inspection.md)',
      'The next goalpost ceiling is `62`.',
    ]);
  });
});
