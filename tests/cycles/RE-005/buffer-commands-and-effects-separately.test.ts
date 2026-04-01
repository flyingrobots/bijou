import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('RE-005 buffer commands and effects separately cycle', () => {
  it('captures the active cycle, buffer semantics, and remaining runtime-engine backlog slices', () => {
    const legend = read('/Users/james/git/bijou/docs/legends/RE-runtime-engine.md');
    const cycle = read('/Users/james/git/bijou/docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const backlogComponents = read('/Users/james/git/bijou/docs/BACKLOG/RE-006-formalize-component-layout-and-interaction-contracts.md');
    const backlogShell = read('/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(legend).toContain('RE-005 — Buffer Commands and Effects Separately');
    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('command and effect outputs are still only loose arrays');
    expect(cycle).toContain('append multiple route results in order');
    expect(cycle).toContain('commands are applied later in FIFO order');
    expect(cycle).toContain('effects are executed later in FIFO order');
    expect(cycle).toContain('handled input can still emit nothing');
    expect(cycle).toContain('## Retrospective');

    expect(backlogComponents).toContain('layout, overflow, and interaction');
    expect(backlogShell).toContain('framed shell');
  });
});
