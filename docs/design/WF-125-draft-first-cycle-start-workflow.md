---
title: WF-125 Draft-first cycle start workflow
legend: WF
lane: design
priority: medium
keywords:
  - workflow
  - method
  - draft-pr
  - design-thinking
---

# WF-125 Draft-first cycle start workflow

## Framing

Issue [#279](https://github.com/flyingrobots/bijou/issues/279) changes the
Bijou cycle loop from "open the pull request at ship time" to "open a draft
pull request at cycle start." The intent is to make issue, branch, design doc,
and PR state visible before implementation expands, while keeping the final
ready-for-review and merge gates strict.

The work follows a Design Thinking loop:

- observe that cycle work can stay invisible until late implementation
- frame draft PRs as early coordination artifacts rather than merge-ready
  review artifacts
- prototype the new loop in Method, Workflow, Contributor, Agent, and issue
  template docs
- prove the policy with a workflow regression that reads those docs

## Sponsored Users

- Maintainers who need early visibility into the branch and linked artifacts.
- Contributors who need one explicit start-of-cycle checklist.
- Agents that need a deterministic order for sync, branch, shape, push, draft
  PR, and work-in-progress labeling.
- Reviewers who should see draft context early without treating it as ready.

## Hills

1. A contributor can start a cycle by syncing the merge target, creating a
   `cycle/<cycle_name>` branch, shaping the issue and design doc, committing
   and pushing that shape, opening a draft PR, and applying
   `work-in-progress`.
2. A reviewer can distinguish an early draft coordination PR from a ready PR
   that has passed implementation, validation, and self-review.
3. A maintainer can run one workflow regression that prevents the docs and
   issue template from drifting back to the old "PR only at ship" loop.

## Playback Questions

- Does every workflow surface say to run `git fetch` and sync the merge target
  before branching?
- Does the cycle branch start from the synced target instead of stale local
  state?
- Does the shaping commit include the GitHub Issue and design doc before
  implementation work begins?
- Does a draft PR to `main` exist before implementation starts?
- Does the issue carry `work-in-progress` while the branch or draft PR is
  actively carrying it?
- Does the draft PR move to ready only after implementation, validation, and
  self-review?

## Workflow Contract

```text
git fetch
sync merge target branch
checkout cycle/<cycle_name>
write or update GitHub Issue
write docs/design/<cycle>.md
stage + commit + push shaping artifact
open draft PR to main
link issue + design doc + draft PR
apply work-in-progress to issue
do RED/GREEN cycle work
validate + self-review
mark PR ready for review
```

## Implementation Notes

- `AGENTS.md` owns the short agent recovery protocol.
- `docs/METHOD.md` owns the doctrine and cycle-state diagram.
- `docs/WORKFLOW.md` owns the operator checklist.
- `CONTRIBUTING.md` owns contributor-facing expectations.
- `.github/ISSUE_TEMPLATE/work-item.yml` owns the issue-form acceptance text.
- `tests/cycles/WF-001/workflow-adoption.test.ts` freezes the contract.

## Tests

- `tests/cycles/WF-001/workflow-adoption.test.ts` adds a regression that reads
  `AGENTS.md`, `CONTRIBUTING.md`, `docs/METHOD.md`, `docs/WORKFLOW.md`, and
  the Method work-item issue template.
- The RED pass failed because `docs/METHOD.md` did not contain the new
  `git fetch` and draft-PR cycle-start language.
- The GREEN pass updates the docs and normalizes Markdown whitespace in the
  regression so wrapped prose can still carry exact policy sentences.

## Closeout

The cycle is landed when:

- the workflow docs require merge-target sync before branching
- the workflow docs require a draft PR to `main` at cycle start
- the issue template requires issue, design doc, and draft PR links
- the draft PR is marked ready only after implementation, validation, and
  self-review
- the WF-001 regression, docs inventory, lint, and whitespace checks pass
- the pull request closes #279
