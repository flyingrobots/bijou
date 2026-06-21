import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-026 mode lowering linter cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DX-026-mode-lowering-linter.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports the mode lowering linter from the bijou root barrel', () => {
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');
    const rootBarrelPart = readRepoFile('packages/bijou/src/index.part06.ts');

    expect(rootBarrel).toContain("export * from './index.part06.js'");
    expect(rootBarrelPart).toContain('lintModeLowering');
    expect(rootBarrelPart).toContain('modeLoweringReportText');
    expect(rootBarrelPart).toContain('ModeLoweringReport');
  });
});
