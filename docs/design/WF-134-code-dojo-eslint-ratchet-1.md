---
title: WF-134 Code Dojo ESLint Ratchet 1
legend: WF
lane: bad-code
priority: high
github_issue: 364
status: proposed
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - v7.2.0
---

# WF-134 Code Dojo ESLint Ratchet 1

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#364](https://github.com/flyingrobots/bijou/issues/364)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)
- Release milestone:
  [`v7.2.0`](https://github.com/flyingrobots/bijou/milestone/5)

## Decision Summary

`Respectful Repo: Enter the Code Dojo` made the standards debt visible and
ratcheted, but the ESLint debt is still the dominant exception class. The
stored ESLint ceiling is `5,345`, while a live type-aware ESLint run on `main`
reports `5,121` findings. The first cleanup pass should convert that already
observed shrink plus targeted high-yield fixes into a lower enforceable ceiling.

This cycle deliberately starts with bounded test and tooling clusters instead
of broad DOGFOOD example rewrites. The DOGFOOD files also carry localization and
code-size tripwires, so they need their own carefully shaped pass.

## Sponsored Human

A maintainer wants the new standards posture to burn down real lint debt now,
not merely document it as a future aspiration.

## Sponsored Agent

An agent needs a concrete first ratchet target with inspectable before/after
counts, so later cycles can keep reducing the ceiling without guessing which
violations are already paid down.

## Hill

Reduce live type-aware ESLint findings from `5,121` to at most `4,900`, then
lower the official ESLint and aggregate Code Dojo debt ceilings so future work
cannot regain the cleaned-up violations.

## Scope

- Target high-yield ESLint clusters first:
  - docs-preview tests under `scripts/docs-preview-*.test.ts`
  - app-frame tests under `packages/bijou-tui/src/app-frame-*.test.ts`
  - single-rule test files such as `packages/bijou/src/core/forms/wizard.test.ts`
- Prefer typed test helpers and guard functions over repeated casts.
- Update `scripts/code-dojo/baselines/eslint.json` to the new live count and
  per-rule counts.
- Update `docs/code-dojo-exceptions.md` and the `code-dojo:debt --max` ceiling.
- Keep the aggregate debt reduction at least 50 violations below the current
  `5,768` ceiling.

## Non-Goals

- Do not soften, disable, or narrow ESLint rules.
- Do not raise any Code Dojo ceiling.
- Do not mix unrelated product behavior changes into the cleanup.
- Do not tackle DOGFOOD mega-file refactors in this first pass unless a touched
  file's policy requires it.
- Do not try to clear all ESLint debt in one oversized branch.

## Current Evidence

A live JSON ESLint run on `main` before this cycle found:

- `5,121` findings across `511` files.
- `2,746` findings in test files.
- `2,375` findings in runtime/source/script files.

Top rule counts:

| Rule | Count |
| :--- | ---: |
| `@typescript-eslint/no-non-null-assertion` | 1,433 |
| `@typescript-eslint/no-unsafe-type-assertion` | 719 |
| `@typescript-eslint/restrict-template-expressions` | 665 |
| `@typescript-eslint/no-explicit-any` | 323 |
| `@typescript-eslint/no-unsafe-member-access` | 234 |

Top file clusters:

| Surface | Count |
| :--- | ---: |
| `packages/bijou-tui/src` | 1,554 |
| `packages/bijou/src` | 1,353 |
| `scripts` | 750 |
| `tests/cycles` | 541 |
| `examples/docs` | 301 |

## Playback Questions

1. Did the live ESLint count fall to `4,900` or lower?
2. Did the stored ESLint baseline match the new live count?
3. Did the aggregate Code Dojo ceiling move down by at least 50 violations?
4. Do focused tests still prove the touched surfaces behave the same?
5. Does `npm run code-dojo:ci` pass after the lower ceiling is installed?

## Tests To Write First

This cycle mostly pays down static-analysis debt in already covered surfaces.
When a cleanup changes runtime behavior or helper contracts, add a focused
regression test before the fix. For purely type-safety rewrites, the RED signal
is the existing ESLint finding and the GREEN signal is the lowered live ESLint
count plus the relevant existing focused suite.

## Acceptance Criteria

- Live ESLint findings are `4,900` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live count.
- `docs/code-dojo-exceptions.md` reports the lower aggregate debt count and next
  target.
- `package.json` lowers `code-dojo:debt --max` by at least 50.
- Focused tests for touched clusters pass.
- `npm run code-dojo:ci`, `npm run docs:inventory`, and `git diff --check`
  pass before final review.

## Retrospective

To be completed when the PR lands.
