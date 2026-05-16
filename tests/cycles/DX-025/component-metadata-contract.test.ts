import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-025 component metadata contract cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DX-025-component-metadata-contract.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports component metadata helpers from the bijou root barrel', () => {
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');

    expect(rootBarrel).toContain('ComponentMetadata');
    expect(rootBarrel).toContain('defineComponentMetadata');
    expect(rootBarrel).toContain('validateComponentMetadata');
    expect(rootBarrel).toContain('componentMetadataSummary');
  });
});
