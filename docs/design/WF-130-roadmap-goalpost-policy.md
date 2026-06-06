# WF-130 Roadmap Goalpost Policy

## Linked Legend

WF - Workflow and Delivery

## Decision Summary

Adopt a Bijou roadmap planning system that maps GitHub milestone items into
versioned releases, candidate goalposts, umbrella issues, user-story issues,
slice budgets, release gates, and proof requirements.

## Sponsor Human

A maintainer wants to see the current release path and backlog shape without
reconstructing it from memory, stale Markdown, and raw GitHub lists, so that
release planning can stay issue-backed and inspectable.

## Sponsor Agent

An agent needs a documented roadmap hierarchy and issue-template fields so it
can classify work as ordinary issues, goalpost umbrellas, or user stories
without inventing planning structure in each turn.

## Hill

By the end of this cycle, Bijou has a release-packet policy, a GitHub-backed
roadmap snapshot, issue-template fields for roadmap roles and slice budgets,
and tests that prevent the docs from drifting back to draft-first cycle
language.

## Current Truth

Verified against `origin/main` on 2026-06-06 after PR #304 merged.

Current anchors:

- GitHub milestone `v6.0.0`: 0 open, 30 closed milestone items.
- GitHub milestone `v7.0.0`: 0 open, 27 closed milestone items.
- GitHub milestone `Beyond`: 29 open, 1 closed milestone item.
- Open unmilestoned issues: #249 and #306.
- `docs/method/releases/README.md` is a stub.
- `docs/METHOD.md`, `docs/WORKFLOW.md`, `CONTRIBUTING.md`, `AGENTS.md`, and
  WF-001 tests still describe draft-first cycle PRs.

## Problem

Bijou has strong issue intake and cycle docs, but it lacks the intermediate
roadmap structure that explains how individual issues become release-scale
goalposts. The docs also contain stale draft-first language that conflicts with
current repo instructions.

## Scope

This cycle includes:

- defining the release-packet contract under `docs/method/releases/`
- refreshing `docs/ROADMAP.md` from live GitHub milestone and issue data
- grouping the open Beyond backlog into candidate goalposts
- adding roadmap role, linkage, slice budget, and release-gate fields to the
  Method work-item issue form
- aligning operator docs to non-draft PRs at cycle start
- adding tests that prove the policy and the non-draft alignment

## Non-Goals

This cycle does not:

- create new release milestones
- move GitHub issues between milestones
- create umbrella issues for the candidate goalposts
- close or rewrite the existing Beyond issues
- implement any product features from the candidate goalposts

## User Experience / Product Shape

This is process and documentation work. There is no TUI surface change.

The reviewer-facing shape is:

```text
docs/ROADMAP.md
  Release Snapshot
  v6.0.0
  v7.0.0
  Beyond
    Candidate Goalposts From Open GitHub Issues
    Open Beyond Issues
    Open Unmilestoned Triage
```

## Lower Modes

### Static Mode

Markdown documents remain readable as plain text.

### Pipe Mode

The relevant proof is deterministic command output from tests and GitHub CLI
queries.

### Accessible Mode

No interactive surface changes. The issue form uses explicit labels and field
names that screen-reader users can navigate in GitHub.

## Runtime / API Contract

No runtime API changes.

Process contract changes:

- `docs/method/releases/README.md` defines versioned releases, goalposts,
  umbrella issues, user-story issues, slices, release gates, and proof.
- `.github/ISSUE_TEMPLATE/work-item.yml` exposes roadmap role, roadmap linkage,
  slice budget, and release-gate fields.
- Cycle-start docs require a non-draft PR.

## Data / State Model

GitHub remains the live tracker. `docs/ROADMAP.md` is a mirror of:

- GitHub milestone counts
- GitHub issue labels
- GitHub issue milestone assignment
- GitHub pull request milestone assignment when milestone counts include PRs

Markdown release packets explain the structure, but GitHub owns the current
state.

## Accessibility Posture

No new visible product controls are added. Markdown tables use explicit column
headers. The issue-template additions use field labels that state their
purpose without relying on placeholder-only instructions.

## Localization / Directionality Posture

No app-visible localized strings are added. GitHub issue-template prose is not
part of the DOGFOOD runtime localization catalog.

## Agent Inspectability / Explainability Posture

Agents can inspect the policy through stable files:

- `docs/method/releases/README.md`
- `docs/ROADMAP.md`
- `.github/ISSUE_TEMPLATE/work-item.yml`
- `tests/cycles/WF-130/roadmap-goalpost-policy.test.ts`

The roadmap records the exact sync date and GitHub issue groupings.

## Linked Invariants

- Tests Are the Spec
- Runtime Truth Wins
- Docs Are the Demo
- Work Is Issue-Backed
- Release Claims Need Proof

## Implementation Outline

1. Add a failing WF-130 regression for release packets, roadmap counts,
   non-draft cycle docs, and issue-template fields.
2. Write the release-packet policy.
3. Refresh the roadmap from live GitHub milestones and issues.
4. Align METHOD, WORKFLOW, AGENTS, CONTRIBUTING, and WF-001 tests to
   non-draft PRs.
5. Extend the work-item issue template.
6. Record the changelog entry and run validation.

## Tests To Write First

- `npm test -- --run tests/cycles/WF-130/roadmap-goalpost-policy.test.ts`
  should fail before the policy and docs exist.
- The same focused command should pass after the policy is implemented.
- WF-001 workflow tests should continue passing with the non-draft wording.

## Validation Plan

```bash
npm test -- --run tests/cycles/WF-130/roadmap-goalpost-policy.test.ts
npm test -- --run tests/cycles/WF-001/workflow-adoption.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.test.ts
npm run docs:inventory
npm run typecheck:test
npm run lint
git diff --check
```

## Closeout Notes

Completed on `cycle/roadmap-goalpost-policy`.

Proof:

- RED: `npm test -- --run tests/cycles/WF-130/roadmap-goalpost-policy.test.ts`
  failed on the release-packet stub, stale roadmap counts, draft-first cycle
  docs, and missing issue-template roadmap fields.
- GREEN: WF-130 passes after the release policy, roadmap refresh, issue form,
  label model, and non-draft workflow alignment landed.
- WF-001 was updated and rerun with WF-130 so the older workflow invariant
  agrees with the new non-draft cycle policy.
- GitHub labels `roadmap`, `goalpost`, and `user-story` were created for
  queryable roadmap role tracking.

Validation:

```bash
npm test -- --run tests/cycles/WF-001/workflow-adoption.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.test.ts
npm run docs:inventory
npm run typecheck:test
npm run lint
git diff --check
```
