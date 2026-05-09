import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('HT-007 focus map surface cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/HT-007-focus-map-surface.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports the focus map API from the bijou-tui source barrel', () => {
    const barrel = readRepoFile('packages/bijou-tui/src/index.ts');

    expect(barrel).toContain('focusMapText');
    expect(barrel).toContain('focusMapSurface');
    expect(barrel).toContain('inspectFocusMap');
    expect(barrel).toContain('FocusMapNode');
  });
});
