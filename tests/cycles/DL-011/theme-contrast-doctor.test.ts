import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DL-011 theme contrast doctor cycle', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DL-011-theme-contrast-doctor.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('exports the doctor from core and root theme barrels', () => {
    const themeBarrel = readRepoFile('packages/bijou/src/core/theme/index.ts');
    const rootBarrel = readRepoFile('packages/bijou/src/index.ts');
    const rootBarrelPart = readRepoFile('packages/bijou/src/index.part07.ts');

    expect(themeBarrel).toContain('doctorTheme');
    expect(themeBarrel).toContain('themeContrastRatio');
    expect(rootBarrel).toContain("export * from './index.part07.js'");
    expect(rootBarrelPart).toContain('doctorTheme');
    expect(rootBarrelPart).toContain('ThemeDoctorReport');
  });
});
