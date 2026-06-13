# WF-131 Roadmap Forward-Looking Refresh

## Linked Legend

WF - Workflow and Delivery

## Decision Summary

Refresh `docs/ROADMAP.md` and `docs/BEARING.md` so they describe the forward
post-`v7.0.0` release horizon instead of implying the complete `v6.0.0` and
`v7.0.0` milestone lanes still need release-readiness work before tagging. The
refresh now also selects the forward train: `v7.1.0` next, no planned feature
`v7.2.0`, `v8.0.0` for the Runtime Graph and Scene IR product contract, and
`v9.0.0` for Product Workbench and operator surfaces.

## Sponsor Human

A maintainer noticed that the roadmap felt significantly outdated and asked for
it to reflect current reality.

## Sponsor Agent

An agent needs the roadmap to distinguish live tracker truth from historical
release lineage so it can select the next slice without reopening already
closed release lanes.

## Hill

By the end of this cycle, the roadmap names `v7.0.0` as the latest shipped
public release, records that `v6.0.0` was skipped as a public package release,
treats complete milestone lanes as lineage, selects `v7.1.0` as the next public
release target, says there is no planned `v7.2.0` feature train, organizes
`v8.0.0` and `v9.0.0`, surfaces unmilestoned triage and open pull requests, and
preserves deterministic tests for the GitHub-backed counts.

## Current Truth

Verified against GitHub on 2026-06-13.

- Latest public release tag: `v7.0.0`.
- `v6.0.0` was skipped as a public package release; its milestone is closed
  tracker lineage.
- GitHub milestone `v6.0.0`: 0 open, 30 closed milestone items.
- GitHub milestone `v7.0.0`: 0 open, 27 closed milestone items.
- GitHub milestone `Beyond`: 33 open, 4 closed milestone items.
- Open unmilestoned issues: #321, #317, #316, #306, and #249.
- Open pull requests: dependency PR #326, unmilestoned.
- Active implementation gravity: DX-046, a real GraphQL-authored DOGFOOD block
  fixture for #302.
- Selected next public release target: `v7.1.0`.
- Planned feature train after `v7.1.0`: `v8.0.0`, not `v7.2.0`.

## Problem

The roadmap's numerical snapshot was recently synced, but the surrounding
release narrative still read as if V7 had not shipped and as if v6/v7
release-readiness validation remained the next release-facing action. It also
spent too much space on past milestone inventory when the useful work now is
choosing the next release candidate from `Beyond`. That contradicts
`docs/release.md`, which already names `7.0.0` as the latest shipped release
and says the older v6/v7 milestones are retained as lineage.

## Scope

This cycle includes:

- rewriting the roadmap around the shipped `v7.0.0` boundary and forward
  release train
- recording that `v6.0.0` was skipped as a public package release
- replacing pending-tag wording in v6/v7 sections with complete-lineage wording
- selecting `v7.1.0` as the next public release target
- declaring that there is no planned `v7.2.0` feature train
- organizing `v8.0.0` around Runtime Graph and Scene IR
- organizing `v9.0.0` around Product Workbench and operator surfaces
- making the post-v7 active pull explicit
- adding explicit decision points for how `Beyond` work becomes V8/V9 release
  work
- preserving open Beyond issue accounting
- adding current unmilestoned issue triage and the open dependency PR
- aligning BEARING with the same release posture
- aligning `docs/release.md` with the selected `v7.1.0` posture
- updating WF-130 roadmap checks so stale release-readiness wording does not
  return

## Non-Goals

This cycle does not:

- move any GitHub issues between milestones
- create a new versioned release milestone
- implement the tracker-sync sentinel from #268
- implement DX-046 or any product feature

## User Experience / Product Shape

This is documentation and workflow truth work. There is no runtime or TUI
surface change.

The reviewer-facing shape is:

```text
docs/ROADMAP.md
  Current Release State
  Release Train Decision
  Next Pull
  Forward Goalposts
  Decision Points
  Open Beyond Issues
  Open Unmilestoned Triage
  Open Pull Requests Outside Release Horizons
  Closed Lineage

docs/release.md
  Next Release Posture
```

## Lower Modes

### Static Mode

Markdown remains readable in plain text and in DOGFOOD's docs reader.

### Pipe Mode

The proof is deterministic CLI output from GitHub and local tests.

### Accessible Mode

Tables keep explicit headers and avoid relying on prose-only counts.

## Runtime / API Contract

No runtime API changes.

## Data / State Model

GitHub milestones, issue labels, and PR state remain live tracker truth.
`docs/ROADMAP.md` mirrors that state for humans and records the sync date.

## Accessibility Posture

No interactive controls are added. Markdown tables and short prose summaries
keep the roadmap navigable for screen readers and terminal readers.

## Localization / Directionality Posture

No app-visible localized strings are added.

## Agent Inspectability / Explainability Posture

Agents can inspect:

- `docs/ROADMAP.md` for release horizon and candidate goalpost state
- `docs/BEARING.md` for active gravity
- `docs/release.md` for shipped-release posture
- `tests/cycles/WF-130/roadmap-goalpost-policy.test.ts` for deterministic
  roadmap expectations

## Linked Invariants

- Work Is Issue-Backed
- Docs Are the Demo
- Release Claims Need Proof
- Runtime Truth Wins

## Implementation Outline

1. Capture live GitHub milestone, issue, and PR state.
2. Comment on #268 to connect this manual refresh to the tracker-sync problem.
3. Refresh `docs/ROADMAP.md`.
4. Align `docs/BEARING.md`.
5. Select and record the post-V7 release train.
6. Update changelog and WF-130 regression expectations.
7. Run focused validation.

## Tests To Write First

- Update WF-130 expectations so stale text such as "release-readiness
  validation before tagging" fails if it returns to `docs/ROADMAP.md`.
- Assert that `v7.1.0`, no planned feature `v7.2.0`, `v8.0.0`, and `v9.0.0`
  stay visible in `docs/ROADMAP.md`.
- Keep the Beyond row count tied to the `Open Beyond Issues` table.
- Assert the current unmilestoned triage and dependency PR are visible.

## Validation Plan

```bash
npm test -- --run tests/cycles/WF-130/roadmap-goalpost-policy.test.ts
npm run docs:inventory
npm run typecheck:test
npm run lint
git diff --check
```
