import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  normalized,
  ROOT,
} from '../WF-130/roadmap-goalpost-policy.test-support.js';

const DESIGN_PATH = 'docs/design/DX-050-profunctor-page-inspection.md';

describe('DX-050 Profunctor Page inspection design', () => {
  it('records the completed cycle contract and closeout evidence', () => {
    expect(existsSync(`${ROOT}/${DESIGN_PATH}`)).toBe(true);
    const design = normalized(DESIGN_PATH);

    expectClaims(design, [
      'github_issue: 468',
      'status: complete',
      'Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)',
      '## Current Truth',
      '## Acceptance Criteria',
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
      '`profunctor-page-source-map/0`',
      '`profunctor-build-manifest/0`',
      '`ui-scene-ir/1`',
      '`Surface`',
      '`6a411d7`',
      'SHA-256',
      'fail closed',
      'byte-identical',
      '`62` aggregate violations or lower',
      'Focused contract evidence passes `38` tests',
      'Full local verification passes `4,015` tests',
      'Hidden unsupported blocks become `hidden-unsupported-block` residuals',
      'Visible unsupported blocks',
    ]);
  });

  it('keeps roadmap and bearing aligned with live tracker truth', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');

    expectClaims(roadmap, [
      'Last synced from GitHub milestone items: 2026-07-29.',
      '| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 20 | 2 |',
      '[#472](https://github.com/flyingrobots/bijou/issues/472)',
      '[#473](https://github.com/flyingrobots/bijou/issues/473)',
      '[DX-050](./design/DX-050-profunctor-page-inspection.md)',
    ]);
    expectClaims(bearing, [
      '`v8.2.0` milestone is quality automation and Method hardening: 20 open and 2 closed milestone items',
      '`v8.0.0` milestone is the active feature horizon: 2 open milestone items and 2 closed milestone items',
      '[DX-050](./design/DX-050-profunctor-page-inspection.md)',
      '[RE-036](./design/RE-036-packed-bijou-cells-surface-adapter.md)',
      'Current debt comprises `32` file/context and `20` code-size violations',
    ]);
  });
});
