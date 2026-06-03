# Bijou Workflow

_The repo-local workflow summary for Bijou's METHOD adoption_

For doctrine, read [METHOD.md](./METHOD.md). This file is the short
operator summary.
For release mechanics, read [release.md](./release.md).

## Current Surfaces

Bijou now tracks work through:

- **Legends**
  - [`docs/legends/`](./legends/README.md)
  - named long-lived work domains
- **Cycles**
  - [`docs/design/`](./design/README.md)
  - active and landed cycle docs
- [`docs/method/backlog/`](./method/backlog/README.md)
  - canonical live backlog lanes and shaped release lanes
- [`docs/BEARING.md`](./BEARING.md)
  - current direction and tensions
- [`docs/VISION.md`](./VISION.md)
  - bounded executive synthesis
- [`docs/CHANGELOG.md`](./CHANGELOG.md)
  - merged or shipped behavior truth
- `tests/cycles/<cycle>/`
  - cycle-owned executable proof

## Working Loop

1. Sync to the merge target branch after `git fetch`.
2. Create a branch named `cycle/<cycle_name>` for that cycle.
3. Write or enrich the GitHub Issue and the `docs/design/` cycle doc.
4. Stage and commit the shaping artifact, push the branch, and open a draft
   pull request to `main` before implementation work starts.
5. Link the GitHub Issue, design doc, and draft PR. Apply
   `work-in-progress` to the GitHub Issue.
6. Write failing tests. Playback questions become the executable spec.
7. Green the tests.
8. Record witness material when needed.
9. Close honestly: retrospective, drift notes, and follow-on backlog.
10. Run validation and self-review, then mark the draft PR ready for review.
11. After merge, sync `BEARING.md`, `CHANGELOG.md`, and any other
    signposts that changed.

## GitHub Comment Safety

Structured review comments often contain Markdown tables, code spans, shell
examples, `$()` text, and copied command output. Post those comments through
`--body-file` with a quoted heredoc or a real body file so the shell cannot
evaluate the body before GitHub receives it. Do not use inline `--body "..."`
for self-review findings, Code Lawyer reports, activity summaries, or any other
Markdown-heavy comment.

Safe PR comment pattern:

```sh
gh pr comment "$PR_NUMBER" --body-file - <<'EOF'
# Self-Code Review

| Severity | Count |
| :--- | ---: |
| P0 | 0 |

Commands stay literal: `npm test`, `gh pr checks`, and $().
EOF
```

Safe issue comment pattern:

```sh
gh issue comment "$ISSUE_NUMBER" --body-file - <<'EOF'
Linked artifacts:
- Design: `docs/design/WF-128-safe-gh-comments-and-milestone-items.md`
- Tests: `tests/cycles/WF-128/safe-comments-and-milestone-items.test.ts`
EOF
```

Use a temporary file with `--body-file "$PATH"` when the comment is generated
by a script. Delete the temporary file after the command succeeds.

## PR Size Discipline

Release-boundary work must still move through reviewable PRs.

Use precursor PRs before the final release sync when a branch is likely to
cross automated review limits.

Hard stop before marking a PR ready for review:

- more than 140 changed files

Caution threshold before marking a PR ready for review:

- more than 10 commits
- unrelated legends or cycle families on one branch
- generated snapshots or docs mixed with unrelated runtime changes
- more than one release-lane blocker implemented at once

When a threshold is hit, split the work by cycle or product surface:

- runtime engine
- TUI shell and interaction
- core components
- DOGFOOD and docs proof
- backlog or release-lane bookkeeping
- version, changelog, and final release docs

The final release PR should be boring: version bump, changelog, long-form
release docs, release-readiness proof, and final metadata only. Feature work
should land through precursor PRs before that point.

## Repo Rules

- `docs/specs/` remains a legacy/reference surface for older artifacts.
- `docs/ROADMAP.md` is reference, not the current queue.
- `docs/strategy/README.md` separates living doctrine from historical strategy notes.
- `docs/BEARING.md` is a direction summary, not the source of truth.
- Legends, cycle docs, tests, and backlog placement must agree.
- Agents are first-class users and should have explicit hills and
  playback questions where relevant.
- Version-target backlog lanes like `docs/method/backlog/vX.Y.Z/` are only for
  cycles that must land before that shaped release ships.

## Read Order

For current truth, start at [docs/README.md](./README.md), then read:

1. [METHOD.md](./METHOD.md)
2. [BEARING.md](./BEARING.md)
3. the relevant [Legend](./legends/README.md)
4. the relevant backlog lane or cycle doc
5. [CHANGELOG.md](./CHANGELOG.md) if shipped behavior matters
