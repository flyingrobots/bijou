import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

const REQUIRED_WORK_ITEM_LABELS = [
  'Requested classification',
  'Decision summary',
  'Sponsored human',
  'Sponsored agent',
  'Hill',
  'Current truth',
  'Problem',
  'Scope',
  'Non-goals',
  'User experience / product shape',
  'Lower modes',
  'Runtime / API contract',
  'Data / state model',
  'Accessibility posture',
  'Localization / directionality posture',
  'Agent inspectability / explainability posture',
  'Linked invariants',
  'Implementation slices',
  'Tests to write first',
  'Acceptance criteria',
  'Validation plan',
  'Playback / witness',
  'Risks and follow-on debt',
  'Method artifacts',
  'Triage rule',
] as const;

describe('WF-124 design-document intake template', () => {
  it('keeps the Method work-item issue form aligned with the design document template', () => {
    const workItemTemplate = readRepoFile('.github/ISSUE_TEMPLATE/work-item.yml');
    const labels = issueFormFieldLabels(workItemTemplate);

    expect(labels).toEqual(expect.arrayContaining([...REQUIRED_WORK_ITEM_LABELS]));
    expect(labels.indexOf('Decision summary')).toBeLessThan(labels.indexOf('Tests to write first'));
    expect(labels.indexOf('Tests to write first')).toBeLessThan(labels.indexOf('Acceptance criteria'));
  });

  it('requires implementation issues to name software behavior proof instead of doc-only proof', () => {
    const workItemTemplate = readRepoFile('.github/ISSUE_TEMPLATE/work-item.yml');

    expect(workItemTemplate).toContain('Behavior/software proof required for implementation work');
    expect(workItemTemplate).toContain('Documentation-only proof is acceptable only for documentation/process work');
    expect(workItemTemplate).toContain('package API, runtime behavior, rendered output, scripted app flow');
    expect(workItemTemplate).toContain('schema validation, lower-mode output, or CI/tooling behavior');
  });

  it('documents issue-template-first enforcement instead of branch-name commit blocking', () => {
    const method = normalizeWhitespace(readRepoFile('docs/METHOD.md'));

    expect(method).toContain('Issue templates are the default shaping enforcement.');
    expect(method).toContain('Do not block every commit on branch-name-to-design-doc matching.');
    expect(method).toContain('Hotfixes, CI repairs, dependency repairs, and small maintenance work may not have a full design doc.');
  });
});

function issueFormFieldLabels(source: string): readonly string[] {
  return [...source.matchAll(/^\s{6}label:\s*(.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((label): label is string => label !== undefined && label.length > 0);
}

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
