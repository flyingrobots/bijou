import { describe, expect, it } from 'vitest';
import { RE035_LAYOUT_SCOPE } from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

describe('RE-035 layout envelope closeout', () => {
  it('marks the first layout-envelope cycle as landed with explicit future scope', () => {
    expect(RE035_LAYOUT_SCOPE).toMatchObject({
      design: 'RE-035',
      status: 'landed',
      included: [
        'layout-envelope',
        'constraint-negotiation',
        'stack',
        'place',
        'content-measurement-seam',
        'render-assignment-seam',
      ],
      deferred: [
        'RE-036 text measurement and inline flow',
        'RE-037 overflow, viewports, scroll anchoring, and scrollbars',
        'RE-038 box model, chrome regions, hit testing, and focus maps',
        'RE-039 responsive variants, compression, and constraint fallbacks',
        'RE-040 accessible layout semantics',
        'WS-001 workspace tree',
      ],
    });
  });

  it('preserves closeout evidence in the Method design artifact', () => {
    const design = readRepoFile('docs/design/RE-035-mandatory-layout-envelope-and-constraint-negotiation.md');

    expect(design).toContain('## Drift Check');
    expect(design).toContain('## Playback');
    expect(design).toContain('## Retrospective');
    expect(design).toContain('The first ten slices establish the boring floor');
    expect(design).toContain('Follow-on adoption should be separate and test-led');
    expect(design).toContain('RE-036 Text Measurement And Inline Flow');
  });

  it('keeps v6 tracker docs aligned after closing issue 180', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const backlog = readRepoFile('docs/method/backlog/v6.0.0/README.md');

    expect(bearing).toContain('three open tracker items');
    expect(bearing).toContain('[#181](https://github.com/flyingrobots/bijou/issues/181)');
    expect(bearing).not.toContain('[#180](https://github.com/flyingrobots/bijou/issues/180) — `RE-035`');

    expect(roadmap).toContain('| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 3 | 21 |');
    expect(roadmap).toContain('| [#180](https://github.com/flyingrobots/bijou/issues/180) | `lane:release` | `type:enhancement` | RE-035 mandatory layout envelope and constraint negotiation |');
    expect(roadmap).toContain('| [#250](https://github.com/flyingrobots/bijou/pull/250) | `dependencies` | dependency PR | Vitest `4.0.18` to `4.1.8` release-hygiene bump |');
    expect(roadmap).toContain('| [#251](https://github.com/flyingrobots/bijou/pull/251) | `lane:release` | implementation PR | RE-035 layout envelope primitives |');

    expect(backlog).toContain('## Landed Layout Anchor');
    expect(backlog).toContain('PR #251');
    expect(backlog).toContain('issue #180');
  });
});
