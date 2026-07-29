import { describe, it } from 'vitest';
import {
  expectClaims,
  normalized,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap release state', () => {
  it('keeps the release horizon and milestone snapshot explicit', () => {
    const roadmap = normalized('docs/ROADMAP.md');

    expectClaims(roadmap, [
      'This roadmap is the forward-looking release horizon for Bijou.',
      'Last synced from GitHub milestone items: 2026-07-28.',
      'The latest shipped public release is',
      '`v7.1.0` is complete post-V7 minor release lineage',
      '`v7.2.0` is complete narrow stabilization and demo-integrity release lineage.',
      'v6.0.0` was never published as a public package release',
      'Release Train Decision',
      '`v7.1.0`: Previous Shipped Post-V7 Minor',
      '`v7.2.0`: Shipped Stabilization And Demo Integrity',
      '`v8.0.0`: Runtime Graph And Scene IR Product Contract',
      '`v8.1.0`: Replay, Capture, And Render Witnesses',
      '`v8.2.0`: Quality Automation And Method Hardening',
      '`v9.0.0`: Product Workbench And Operator Surfaces',
      '`v10.0.0`: Renderer And Host Systems Integration',
      '| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 0 | 19 |',
      '| `v8.0.0` | [v8.0.0](https://github.com/flyingrobots/bijou/milestone/6) | 3 | 1 |',
      '| `v8.1.0` | [v8.1.0](https://github.com/flyingrobots/bijou/milestone/7) | 13 | 0 |',
      '| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 14 | 0 |',
      '| `v9.0.0` | [v9.0.0](https://github.com/flyingrobots/bijou/milestone/9) | 20 | 0 |',
      '| `v10.0.0` | [v10.0.0](https://github.com/flyingrobots/bijou/milestone/10) | 10 | 0 |',
      '| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 |',
      '`Beyond`',
      '0 | 6',
    ]);
  });
});
