---
title: WF-129 Path-Gate DOGFOOD CI
legend: WF
lane: bad-code
priority: medium
issue: https://github.com/flyingrobots/bijou/issues/293
keywords:
  - ci
  - dogfood
  - path-gates
  - iteration-time
  - workflow
---

# WF-129 Path-Gate DOGFOOD CI

## Framing

The CI loop is intentionally conservative, but ordinary workflow/documentation
PRs currently run DOGFOOD-heavy gates even when they do not touch DOGFOOD,
runtime components, localization, or CI scripts. That makes rapid-fire cycles
pay duplicate install/build/smoke costs before review can close.

This cycle adds a CI change classifier so DOGFOOD-specific checks run when they
are relevant and skip when a PR is unrelated to DOGFOOD. Pushes to `main` and
tag workflows remain full-strength.

## Sponsored Users

- A maintainer iterating on workflow documentation needs PR CI to avoid
  DOGFOOD smoke work when the branch cannot affect DOGFOOD.
- A release maintainer needs `main` pushes and tags to continue running the
  full DOGFOOD proof path.
- A review agent needs the path-gating contract to be visible in the workflow
  file and covered by a regression test.

## Hill

A contributor can open a PR that only changes non-DOGFOOD docs or workflow
bookkeeping and see DOGFOOD-heavy CI lanes skipped, while any PR touching
DOGFOOD, packages, localization, DOGFOOD scripts/tests, or CI workflows still
runs DOGFOOD proof.

## Current Truth

- `scripts/hooks/pre-push` runs DOGFOOD i18n, test typecheck, full Vitest, and
  interactive example smoke before every push.
- `.github/workflows/ci.yml` runs DOGFOOD coverage and i18n policy inside the
  Ubuntu Node 22 `test` job for every PR.
- `.github/workflows/ci.yml` runs separate DOGFOOD landing/docs smoke jobs for
  every PR, with their own checkout, install, and build.
- The latest main CI run after PR #291 had a `test (22)` critical path just
  under two minutes, plus separate DOGFOOD smoke jobs.

## Product Shape

### CI Classifier

```text
CI
  changes
    dogfood = true on main pushes and tags
    dogfood = true on PRs touching:
      .github/workflows/**
      package.json
      package-lock.json
      packages/**
      examples/docs/**
      scripts/dogfood-*
      scripts/smoke-dogfood*
      tests/cycles/DF-*
      tests/cycles/*dogfood*
      docs/DOGFOOD.md
      docs/design/DF-*
      docs/legends/DF-*
      docs/method/legends/DF-*
```

### Gated DOGFOOD Proof

```text
test (22)
  always: build, lint, npm test
  when dogfood-relevant: DOGFOOD coverage + DOGFOOD i18n policy

Smoke DOGFOOD (landing/docs)
  when dogfood-relevant: run checkout, install, build, and smoke command
  otherwise: keep check names present and skip expensive smoke steps
```

## Runtime And API Contract

This cycle changes CI workflow behavior only. It does not change package APIs,
runtime behavior, DOGFOOD rendering, localization catalogs, or release
workflows.

## Lower Modes

No TUI output changes are included.

- Static mode: not applicable.
- Pipe mode: not applicable.
- Accessible mode: not applicable.

## Tests To Write First

- Add `tests/cycles/WF-129/path-gate-dogfood-ci.test.ts`.
- RED state:
  - CI lacks a `changes` job exposing `dogfood` output
  - DOGFOOD coverage/i18n policy steps are not guarded by the classifier
  - DOGFOOD smoke job is not guarded by the classifier
  - `main`/tag pushes are not documented as full DOGFOOD proof
- GREEN state:
  - workflow text includes the classifier and relevant trigger paths
  - workflow text gates DOGFOOD-heavy PR work on `needs.changes.outputs.dogfood`
  - changelog records the CI iteration-time cleanup

## Acceptance Criteria

- Issue #293 is closed by the PR.
- PR CI has an explicit `changes` job.
- DOGFOOD coverage/i18n policy steps run only when the classifier says DOGFOOD
  proof is needed.
- DOGFOOD landing/docs smoke commands run only when the classifier says DOGFOOD
  proof is needed, while the check names remain present.
- Pushes to `main` and tags still set the DOGFOOD classifier to true.
- WF-129 passes.
- `docs/CHANGELOG.md` records the change.

## Risks And Guardrails

- Do not path-gate release dry-run or publish workflows in this cycle.
- Do not skip full `npm test` in the core Ubuntu matrix yet.
- Do not weaken DOGFOOD proof when `packages/**`, `examples/docs/**`, or
  DOGFOOD-specific scripts/tests change.
- Keep the classifier readable enough to audit in review.
