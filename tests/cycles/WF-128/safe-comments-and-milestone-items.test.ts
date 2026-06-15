import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-128 safe GitHub comments and milestone item mirrors', () => {
  it('documents a shell-safe GitHub comment path for Markdown-heavy review comments', () => {
    const workflow = readRepoFile('docs/WORKFLOW.md');
    const method = readRepoFile('docs/METHOD.md');
    const agents = readRepoFile('AGENTS.md');
    const contributing = readRepoFile('CONTRIBUTING.md');
    const workflowDocs = [workflow, method, agents, contributing].join('\n');
    const normalizedMethod = normalizeWhitespace(method);

    expect(existsRepoPath('docs/design/WF-128-safe-gh-comments-and-milestone-items.md')).toBe(
      true,
    );
    expect(workflow).toContain('## GitHub Comment Safety');
    expect(workflow).toContain("gh pr comment \"$PR_NUMBER\" --body-file - <<'EOF'");
    expect(workflow).toContain("gh issue comment \"$ISSUE_NUMBER\" --body-file - <<'EOF'");
    expect(normalizedMethod).toContain('Use the GitHub Comment Safety pattern in `docs/WORKFLOW.md`');
    expect(agents).toContain('Post Markdown-heavy GitHub comments through `--body-file`');
    expect(contributing).toContain('Use `--body-file` for Markdown-heavy GitHub comments');

    expect(workflowDocs).toContain('Do not use inline `--body "..."`');
    expect(workflowDocs).not.toMatch(
      /gh (?:pr|issue) comment[^\n]*--body(?:\s|=)(?:"[^"\n]*"|'[^'\n]*')/,
    );
  });

  it('makes ROADMAP release snapshot counts explicit milestone item mirrors', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const normalizedRoadmap = normalizeWhitespace(roadmap);

    expect(roadmap).toContain('| Horizon | Milestone | Open Items | Closed Items | Current Posture |');
    expect(roadmap).toMatch(/Release snapshot counts are GitHub milestone item totals:[\s\S]+issues[\s\S]+pull requests/);
    expect(normalizedRoadmap).toContain(
      'Do not compare release snapshot item totals to issue-only `gh issue list` output',
    );
    expect(roadmap).toContain('gh pr list --state all --search');
    expect(roadmap).toContain('Dependency Security Lineage');
    expect(roadmap).toContain('Closed Dependabot PR for `esbuild` `0.28.0` to `0.28.1`');
    expect(roadmap).not.toContain('| Horizon | Milestone | Open | Closed | Intent |');
  });

  it('records the cleanup in the changelog', () => {
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(changelog).toContain('Safe GitHub comments and milestone item mirrors');
    expect(changelog).toContain('This closes issues #287 and #288.');
  });
});

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
