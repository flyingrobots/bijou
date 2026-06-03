---
title: WF-128 Safe GitHub Comments And Milestone Item Mirrors
legend: WF
lane: bad-code
priority: medium
issues:
  - https://github.com/flyingrobots/bijou/issues/287
  - https://github.com/flyingrobots/bijou/issues/288
keywords:
  - github
  - comments
  - roadmap
  - milestone
  - workflow
---

# WF-128 Safe GitHub Comments And Milestone Item Mirrors

## Framing

Two small workflow defects came out of the V7 closeout:

- review comments can be corrupted when Markdown literals are passed through a
  shell-interpolated `gh pr comment --body "..."` argument
- roadmap release snapshots can be misread when GitHub milestone totals include
  pull requests as milestone items while nearby prose says "issues"

Both are process bugs. They do not change runtime behavior, but they do affect
the reliability of review evidence and release bookkeeping.

## Sponsored Users

- A maintainer posting self-review, Code Lawyer, or activity-summary comments
  needs a command pattern that preserves Markdown literally.
- A release maintainer reading `ROADMAP.md` needs to know whether the snapshot
  counts GitHub milestone items or issue-only rows.
- A review agent needs executable repo tests that catch unsafe comment examples
  and ambiguous milestone-count language before the pattern spreads.

## Hill

A maintainer can post Markdown-heavy GitHub comments and reconcile release
snapshot rows without relying on memory: `docs/WORKFLOW.md`, `docs/METHOD.md`,
and `docs/ROADMAP.md` state the safe conventions, and WF-128 tests prove those
conventions stay visible.

## Current Truth

- Issue #287 records that a PR #284 self-review comment was polluted when
  Markdown backticks inside a double-quoted `--body` argument were evaluated by
  the shell.
- Issue #288 records that V7 tracker-sync work had to count milestone PRs #278
  and #280 to match GitHub milestone totals.
- `docs/WORKFLOW.md` and `docs/METHOD.md` do not currently name the
  `--body-file` / literal-heredoc path for review comments.
- `docs/ROADMAP.md` says GitHub milestones and issue labels are live tracker
  state, but the release snapshot columns are named only `Open` and `Closed`,
  which makes item counts look like issue-only counts.

## Product Shape

### Safe Comment Posting

```text
Workflow review step
  self-review / Code Lawyer / activity summary
    |
    v
  gh pr comment "$PR_NUMBER" --body-file - <<'EOF'
  Markdown stays literal:
  - `commands`
  - $()
  - tables
  EOF
```

The rule is intentionally boring: if a GitHub comment body contains Markdown,
commands, backticks, `$()`, tables, or copied review output, post it through
`--body-file` with a quoted heredoc or a real file.

### Milestone Item Mirrors

```text
GitHub milestone page / API
  open milestone items   = issues + pull requests assigned to milestone
  closed milestone items = issues + pull requests assigned to milestone

ROADMAP release snapshot
  Open Items / Closed Items
  Completed lineage includes milestone PR rows when PRs contribute to totals.
```

## Runtime And API Contract

This cycle changes documentation and cycle-test proof only. It does not change
package exports, runtime APIs, schemas, localization strings, or DOGFOOD
rendered output.

## Lower Modes

No user-facing TUI surface changes are included.

- Static mode: documentation prose becomes clearer.
- Pipe mode: not applicable because no command output contract changes.
- Accessible mode: not applicable because no rendered app surface changes.

## Tests To Write First

- Add `tests/cycles/WF-128/safe-comments-and-milestone-items.test.ts`.
- RED state:
  - workflow docs do not contain the safe `--body-file - <<'EOF'` pattern
  - roadmap release snapshot does not say `Open Items` / `Closed Items`
  - roadmap maintenance guidance does not warn against comparing item totals to
    issue-only lists without accounting for milestone PRs
- GREEN state:
  - docs expose the safe comment posting rule
  - roadmap terminology distinguishes milestone item counts from issue-only
    counts
  - changelog records the bad-code cleanup

## Acceptance Criteria

- Issue #287 is closed by the PR.
- Issue #288 is closed by the PR.
- `docs/WORKFLOW.md` and `docs/METHOD.md` prefer `--body-file` for
  Markdown-heavy GitHub comments.
- `AGENTS.md` reminds agents not to inline shell-sensitive review comments
  through `--body "..."`.
- `docs/ROADMAP.md` names release snapshot counts as milestone items and states
  that milestone items include issues plus pull requests.
- WF-128 passes.
- `docs/CHANGELOG.md` records the cleanup.

## Risks And Guardrails

- Do not introduce a new GitHub-comment wrapper script unless the docs-only
  pattern proves insufficient.
- Do not solve the broader tracker-sync sentinel from #268 here.
- Do not change release milestones or move any issue between lanes.
- Do not cut V7 in this cycle.
