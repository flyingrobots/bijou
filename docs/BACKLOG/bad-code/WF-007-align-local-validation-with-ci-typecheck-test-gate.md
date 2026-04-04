# WF-007 — Align Local Validation With CI `typecheck:test` Gate

Legend: [WF — Workflow and Delivery](../../legends/WF-workflow-and-delivery.md)

## Idea

The repo's local validation story is still slightly less strict than the
GitHub Actions story.

This PR hit a real example:

- local branch work looked green enough to push
- GitHub Actions failed in `test (22)` during `typecheck:test`
- the failure was a test-only typing drift in
  `tests/cycles/DF-001/dogfood-coverage-progress.test.ts`

That means the repo can still teach a false lesson:

- "looks good locally" is not yet the same thing as
  "will clear the CI gate"

## Why

This is workflow debt, not a product blocker.

The codebase already has a real `typecheck:test` gate and it caught a
legitimate bug. The problem is that the local branch-validation path did
not catch it early enough.

## Hill

A maintainer or agent can run the normal local validation path before
pushing and trust that test-only TypeScript drift will be caught before
GitHub Actions does.

## Likely scope

- inspect which local guardrail should own `typecheck:test`
  - pre-push hook
  - an explicit branch-readiness script
  - both
- make the local witness match the remote CI expectation
- document the intended local gate clearly

## Status

Backlog spawned by PR #59 feedback processing after GitHub Actions
failed on `typecheck:test` and the fix landed in commit `aec306f`.
