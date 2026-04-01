import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-006 formalize component layout and interaction contracts cycle', () => {
  it('captures the active cycle, contract semantics, and remaining runtime-engine backlog slice', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md');
    const backlogShell = read('/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('explicit layout rules');
    expect(cycle).toContain('alignment and anchoring');
    expect(cycle).toContain('overflow ownership');
    expect(cycle).toContain('deepest enabled interactive node');
    expect(cycle).toContain('scroll ownership aligns with viewport overflow');
    expect(cycle).toContain('## First migration candidates');
    expect(cycle).toContain('## Retrospective');

    expect(backlogShell).toContain('framed shell');
  });
});
