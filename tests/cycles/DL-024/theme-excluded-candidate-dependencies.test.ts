import { describe, expect, it } from 'vitest';
import { createTokenGraph, mostVivid, scope } from '@flyingrobots/bijou';

function graphWithExcludedColor(hex: string, scoped: boolean) {
  const candidates = scoped ? scope('palette') : ['palette.allowed', 'palette.excluded'];
  return createTokenGraph({
    palette: { allowed: '#777777', excluded: hex },
    choice: mostVivid(candidates, { not: ['palette.excluded'] }),
  });
}

describe('excluded candidate inspection inputs', () => {
  it.each([true, false])('retains diagnostic dependencies with scoped=%s', (scoped) => {
    const before = graphWithExcludedColor('#ff0000', scoped);
    const after = graphWithExcludedColor('#0000ff', scoped);
    try {
      const original = before.inspect('choice', 'dark');
      const changed = after.inspect('choice', 'dark');
      if (original.kind !== 'rule' || changed.kind !== 'rule') {
        throw new Error('The fixture must inspect a selection rule.');
      }
      expect(original.hex).toBe('#777777');
      expect(changed.hex).toBe(original.hex);
      const originalExcluded = original.candidates.find((candidate) => candidate.path === 'palette.excluded');
      const changedExcluded = changed.candidates.find((candidate) => candidate.path === 'palette.excluded');
      expect(originalExcluded?.hex).toBe('#ff0000');
      expect(originalExcluded?.reasons).toContain('excluded');
      expect(changedExcluded?.hex).toBe('#0000ff');
      expect(changedExcluded?.reasons).toContain('excluded');
      expect(before.dependencies('choice', 'dark')).toContain('palette.excluded');
      expect(after.dependencies('choice', 'dark')).toContain('palette.excluded');
    } finally {
      before.dispose();
      after.dispose();
    }
  });
});
