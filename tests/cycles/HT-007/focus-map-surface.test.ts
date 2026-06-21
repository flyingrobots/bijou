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
    const barrelPart = readRepoFile('packages/bijou-tui/src/index.part03.ts');

    expect(barrel).toContain("export * from './index.part03.js'");
    expect(barrelPart).toContain('focusMapText');
    expect(barrelPart).toContain('focusMapSurface');
    expect(barrelPart).toContain('inspectFocusMap');
    expect(barrelPart).toContain('FocusMapNode');
  });
});
