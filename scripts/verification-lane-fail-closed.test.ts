import { describe, expect, it } from 'vitest';
import { LaneInputError, parseNameStatusZ, parsePathList } from './verification-lane-git.js';
import { classifyChanges, classifyPath, classifyVerificationLane } from './verification-lane.js';

describe('verification lane fails closed', () => {
  it('classifies an empty change set full with reason unknown and dogfood on', () => {
    expect(classifyVerificationLane([])).toEqual({
      lane: 'full',
      dogfood: true,
      reasons: [{ path: '', status: null, lane: 'full', reason: 'unknown', pattern: '<empty change set>', escalation: 'empty-change-set' }],
    });
  });

  it('classifies a path outside every listed pattern full with reason unknown', () => {
    expect(classifyPath({ path: 'brand-new-top-level/thing.ts', status: 'A' })).toEqual({
      path: 'brand-new-top-level/thing.ts',
      status: 'A',
      lane: 'full',
      reason: 'unknown',
      pattern: '<no rule>',
      escalation: null,
    });
  });

  it.each([
    ['D', 'deleted'],
    ['R100', 'renamed'],
    ['R087', 'renamed'],
    ['C075', 'copied'],
    ['T', 'type-changed'],
    ['U', 'unmerged'],
    ['X', 'unrecognized-status'],
    ['B', 'unrecognized-status'],
  ])('escalates a fast-rule path with status %s to full (%s), keeping the rule that matched', (status, escalation) => {
    const entry = classifyPath({ path: 'docs/CHANGELOG.md', status });

    expect(entry).toEqual({ path: 'docs/CHANGELOG.md', status, lane: 'full', reason: 'docs-only', pattern: 'docs/**', escalation });
  });

  it('keeps an addition or modification of a fast path fast', () => {
    expect(classifyChanges([{ path: 'docs/a.md', status: 'A' }, { path: 'tests/b.test.ts', status: 'M' }]).lane).toBe('fast');
  });

  it('classifies both sides of a rename and escalates the diff', () => {
    const changes = parseNameStatusZ('R100\0docs/old.md\0docs/new.md\0M\0docs/CHANGELOG.md\0');
    const decision = classifyChanges(changes);

    expect(changes).toEqual([
      { path: 'docs/old.md', status: 'R100' },
      { path: 'docs/new.md', status: 'R100' },
      { path: 'docs/CHANGELOG.md', status: 'M' },
    ]);
    expect(decision.lane).toBe('full');
    expect(decision.reasons.map((entry) => entry.escalation)).toEqual(['renamed', 'renamed', null]);
  });

  it('escalates a deleted test file even though tests are fast', () => {
    expect(classifyChanges([{ path: 'tests/repo.test.ts', status: 'D' }]).lane).toBe('full');
  });

  it.each(['', '/etc/passwd', 'docs/../packages/bijou/src/index.ts', './docs/a.md', 'docs//a.md', 'docs/a.md/', 'docs\\a.md', 'docs/a\nb.md', 'docs/./a.md'])(
    'classifies the invalid path %j full and sets dogfood',
    (path) => {
      const decision = classifyVerificationLane([path]);

      expect(decision.lane).toBe('full');
      expect(decision.dogfood).toBe(true);
      expect(decision.reasons[0]).toMatchObject({ reason: 'unknown', pattern: '<invalid path>', escalation: 'invalid-path' });
    },
  );

  it.each(['Docs/CHANGELOG.md', 'DOCS/a.md', 'Tests/repo.ts', 'docs/.hidden.md', 'tests/.cache/x.ts', 'scripts/.local.ts'])(
    'does not stretch a fast pattern to the near miss %s',
    (path) => {
      expect(classifyVerificationLane([path]).lane).toBe('full');
    },
  );

  it('never lets a fast rule win over a full rule for the same path', () => {
    for (const path of ['examples/docs/app.test.ts', 'scripts/hooks/pre-push.test.ts', 'docs/releases/notes.md', 'scripts/docker-seal/x.test.mjs']) {
      expect(classifyVerificationLane([path]).lane, path).toBe('full');
    }
  });

  it('refuses an unparseable diff instead of returning a lane', () => {
    expect(() => parseNameStatusZ('M\0docs/a.md\0??\0')).toThrow(LaneInputError);
    expect(() => parseNameStatusZ('R100\0docs/old.md\0')).toThrow(LaneInputError);
    expect(() => parseNameStatusZ('docs/a.md\0')).toThrow(LaneInputError);
    expect(() => parsePathList('M\tdocs/a.md\nnot a status\tdocs/b.md\n')).toThrow(LaneInputError);
  });

  it('reads a path list of bare paths and name-status lines', () => {
    expect(parsePathList('docs/a.md\r\nD\ttests/b.test.ts\nR100\tdocs/c.md\tdocs/d.md\n\n')).toEqual([
      { path: 'docs/a.md', status: null },
      { path: 'tests/b.test.ts', status: 'D' },
      { path: 'docs/c.md', status: 'R100' },
      { path: 'docs/d.md', status: 'R100' },
    ]);
  });
});
