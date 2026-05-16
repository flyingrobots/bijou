import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-022 layout inspector overlay cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DX-022-layout-inspector-overlay.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports the layout inspector API from the bijou-tui source barrel', () => {
    const barrel = readRepoFile('packages/bijou-tui/src/index.ts');

    expect(barrel).toContain('layoutInspectorOverlay');
    expect(barrel).toContain('layoutInspectorText');
  });
});
