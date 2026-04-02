import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';


describe('RE-005 buffer commands and effects separately cycle', () => {
  it('captures the active cycle, buffer semantics, and remaining runtime-engine backlog slices', () => {
    const legend = readRepoFile('docs/legends/RE-runtime-engine.md');
    const cycle = readRepoFile('docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const landedComponents = readRepoFile('docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md');
    const backlogShell = readRepoFile('docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(legend).toContain('RE-006 — Formalize Component Layout and Interaction Contracts');
    expect(legend).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('command and effect outputs are still only loose arrays');
    expect(cycle).toContain('append multiple route results in order');
    expect(cycle).toContain('commands are applied later in FIFO order');
    expect(cycle).toContain('effects are executed later in FIFO order');
    expect(cycle).toContain('handled input can still emit nothing');
    expect(cycle).toContain('## Retrospective');

    expect(landedComponents).toContain('first migration candidates');
    expect(backlogShell).toContain('framed shell');
  });
});
