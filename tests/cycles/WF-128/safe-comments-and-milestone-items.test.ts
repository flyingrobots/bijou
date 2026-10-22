import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-128 safe GitHub comments and milestone item mirrors', () => {
  it('documents a shell-safe GitHub comment path for Markdown-heavy review comments', () => {
    const workflow = readRepoFile('docs/WORKFLOW.md');
    const agents = readRepoFile('AGENTS.md');
    const contributing = readRepoFile('CONTRIBUTING.md');

    expect(existsRepoPath('docs/design/WF-128-safe-gh-comments-and-milestone-items.md')).toBe(
      true,
    );
    expect(workflow).toContain('## GitHub Comment Safety');
    expect(workflow).toContain("gh pr comment \"$PR_NUMBER\" --body-file - <<'EOF'");
    expect(workflow).toContain("gh issue comment \"$ISSUE_NUMBER\" --body-file - <<'EOF'");
    expect(agents).toContain('Post Markdown-heavy GitHub comments through `--body-file`');
    expect(contributing).toContain('Use `--body-file` for Markdown-heavy GitHub comments');
  });

  it('records the cleanup in the changelog', () => {
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(changelog).toContain('Safe GitHub comments and milestone item mirrors');
    expect(changelog).toContain('This closes issues #287 and #288.');
  });
});
