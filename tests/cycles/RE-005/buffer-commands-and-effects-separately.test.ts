import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('RE-005 buffer commands and effects separately cycle', () => {
  it('captures the active cycle, buffer semantics, and remaining runtime-engine backlog slices', () => {
    const cycle = readRepoFile('docs/design/RE-005-buffer-commands-and-effects-separately.md');
    const landedComponents = readRepoFile('docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md');
    const landedShell = readRepoFile('docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('command and effect outputs are still only loose arrays');
    expect(cycle).toContain('append multiple route results in order');
    expect(cycle).toContain('commands are applied later in FIFO order');
    expect(cycle).toContain('effects are executed later in FIFO order');
    expect(cycle).toContain('handled input can still emit nothing');
    expect(cycle).toContain('## Retrospective');

    expect(landedComponents).toContain('first migration candidates');
    expect(landedShell).toContain('framed shell');
  });
});
