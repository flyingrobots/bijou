import { describe, expect, it } from 'vitest';
import { runDebtGitFixture } from './dogfood-debt-git-fixture.js';

const cases = [
  {
    name: 'declared lineage siblings',
    before: 'examples/docs/app-family-pane.ts',
    after: 'examples/docs/app-family-pane.ts',
    sibling: 'examples/docs/app-guide-info-pane.ts',
  },
  {
    name: 'canonical part siblings',
    before: 'examples/docs/fixture.part01.ts',
    after: 'examples/docs/fixture.part01.ts',
    sibling: 'examples/docs/fixture.part02.ts',
  },
  {
    name: 'new part extracted from a canonical root',
    before: 'examples/docs/fixture.ts',
    after: 'examples/docs/fixture.part01.ts',
    sibling: 'examples/docs/fixture.part02.ts',
  },
] as const;

describe.each(cases)('debt CLI comparison: $name', ({ before, after, sibling }) => {
  const base = { [before]: ['Keep existing copy', 'Remove existing copy'], [sibling]: ['Unchanged sibling copy'] };

  it('accepts a reduction without treating unchanged sibling copy as added', () => {
    const result = runDebtGitFixture(base, {
      [after]: ['Keep existing copy'], [sibling]: ['Unchanged sibling copy'],
    });
    expect(result).toEqual({ exitCode: 0, stderr: '' });
  });

  it('rejects newly added visible copy even when the aggregate count falls', () => {
    const result = runDebtGitFixture(base, {
      [after]: ['New visible copy'], [sibling]: ['Unchanged sibling copy'],
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('adds raw string "New visible copy"');
  });

  it('rejects a new duplicate of sibling copy even when the aggregate count falls', () => {
    const result = runDebtGitFixture(base, {
      [after]: ['Unchanged sibling copy'], [sibling]: ['Unchanged sibling copy'],
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('adds raw string "Unchanged sibling copy"');
  });
});
