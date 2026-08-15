import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(path: string): string {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function normalized(path: string): string {
  return read(path).replace(/\s+/g, ' ').trim();
}

describe('WF-167 roadmap milestone authority', () => {
  it('binds the verified GitHub milestone-item snapshot', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const rows = [
      ['v8.0.0', '6', '0', '7'],
      ['v8.1.0', '7', '13', '0'],
      ['v8.2.0', '8', '23', '8'],
      ['v9.0.0', '9', '37', '0'],
      ['v10.0.0', '10', '11', '1'],
    ] as const;

    expect(roadmap).toContain(
      'Last synced from GitHub milestone items: 2026-08-15.',
    );
    for (const [name, number, open, closed] of rows) {
      expect(roadmap).toContain(
        `| \`${name}\` | [${name}](https://github.com/flyingrobots/bijou/milestone/${number}) | ${open} | ${closed} |`,
      );
    }
  });

  it('keeps each release boundary outcome-oriented', () => {
    const roadmap = normalized('docs/ROADMAP.md');

    expect(roadmap).toContain('`v8.0.0`: Runtime Graph Release Closeout');
    expect(roadmap).toContain('merged remediation [#492]');
    expect(roadmap).toContain('active successor [#516]');
    expect(roadmap).toContain('`v8.2.0`: Quality Automation And Reliability');
    expect(roadmap).toContain('Governance [#514]');
    expect(roadmap).toContain(
      '`v9.0.0`: Product Workbench And Sapphire Design Language',
    );
    expect(roadmap).toContain('campaign tracker [#501]');
    expect(roadmap).toContain('compositional state recipes [#512]');
    expect(roadmap).toContain('State Atlas [#513]');
    expect(roadmap).toContain('native GPU cell-host issue [#510]');
    expect(roadmap).toContain('design PR [#511]');
  });

  it('records the authority and no-unmilestoned contracts', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');
    const design = normalized('docs/design/WF-167-roadmap-milestone-authority.md');

    expect(roadmap).toContain(
      'GitHub milestones, issues, pull requests, and labels are the live tracker.',
    );
    expect(roadmap).toContain(
      'No open issue or pull request is currently unmilestoned.',
    );
    expect(bearing).toContain(
      'GitHub Issues and milestones are now the canonical queue.',
    );
    expect(design).toContain('Expected open items after triage: `26`');
    expect(design).toContain('No versioned issue retains `[Beyond]` in its title.');
  });
});
