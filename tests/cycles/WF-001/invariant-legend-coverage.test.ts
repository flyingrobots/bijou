import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

const INVARIANTS = [
  'tests-are-the-spec',
  'runtime-truth-wins',
  'schemas-live-at-boundaries',
  'host-apis-stay-behind-adapters',
  'codecs-are-not-domain-models',
  'focus-owns-input',
  'topmost-layer-dismisses-first',
  'visible-controls-are-a-promise',
  'graceful-lowering-preserves-meaning',
  'shell-owns-shell-concerns',
  'docs-are-the-demo',
  'commands-change-state-effects-do-not',
  'layout-owns-interaction-geometry',
  'state-machine-and-view-stack-are-distinct',
] as const;

describe('WF-001 invariant legend coverage', () => {
  it('lists the full invariant set and protection map in the invariant index', () => {
    const readme = readRepoFile('docs/invariants/README.md');

    expect(readme).toContain('Protection Map');
    for (const invariant of INVARIANTS) {
      expect(readme).toContain(invariant);
    }
  });

  it('makes each invariant name at least one protecting legend', () => {
    for (const invariant of INVARIANTS) {
      const content = readRepoFile(`docs/invariants/${invariant}.md`);
      expect(content).toContain('## Protected by legends');
      expect(content).toMatch(/\[[A-Z]{2} — /);
    }
  });
});
