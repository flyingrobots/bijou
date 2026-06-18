---
title: WF-135 Respecting the Dojo 1000-Count Burndown
legend: WF
lane: bad-code
priority: high
github_issue: 374
status: complete
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - respectful-repo
---

# WF-135 Respecting the Dojo 1000-Count Burndown

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#374](https://github.com/flyingrobots/bijou/issues/374)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)

## Decision Summary

`Respectful Repo: Enter the Code Dojo` made the standards debt enforceable.
WF-134 proved the ratchet can burn down real violations, but `main` still has
thousands of counted exceptions. This cycle raises the bar from minimum
50-count goalpost reductions to a 1000-count burndown pass.

The long-term goal is uncompromising:

- zero ESLint errors
- zero Code Dojo warnings, errors, or issues
- zero files violating length restrictions

This cycle is not allowed to move that goalpost by weakening rules, excluding
files, or raising baselines.

## Sponsored Human

A maintainer wants the repository to stop treating the standards as symbolic
and make a visible move toward real compliance.

## Sponsored Agent

An agent needs a concrete large burndown target, live count evidence, and
clear guardrails so cleanup work stays reviewable instead of becoming a broad
semantic rewrite.

## Hill

Reduce aggregate Code Dojo debt from `4,940` to `3,940` or lower with real
cleanup. Lower the official ratchet ceilings to the new live counts so future
work cannot regain the violations.

## Scope

- Target high-yield, mechanically reviewable ESLint clusters first:
  - non-null assertions that can become local guards or reusable helpers
  - unsafe `any` and unsafe assertion clusters in tests and scripts
  - template-expression findings with explicit string formatting
  - stale async wrappers and unused values where the fix is local
- Reduce file/context debt when touched files exceed the current threshold.
- Keep changes clustered by surface so validation can be focused.
- Update `scripts/code-dojo/baselines/eslint.json`, `docs/code-dojo-exceptions.md`,
  and `package.json` only after live counts prove the reduction.

## Non-Goals

- Do not disable, soften, or narrow ESLint rules.
- Do not raise any Code Dojo ceiling.
- Do not exclude files from Code Dojo or ESLint.
- Do not make risky product behavior changes for static-analysis convenience.
- Do not split mega-files purely by line count unless the ownership boundary is
  obvious and tests can cover the move.

## Current Evidence

Live counts on `main` at `ed438ebe`:

- aggregate Code Dojo debt: `4,940`
- ESLint findings: `4,517`
- ESLint errors: `4,513`
- ESLint warnings: `4`
- file/context baseline: `342`
- mock-ban baseline: `23`
- code-size baseline: `58`, including `4` legacy hard-limit files

Top ESLint rules:

| Rule | Count |
| :--- | ---: |
| `@typescript-eslint/no-non-null-assertion` | 1,408 |
| `@typescript-eslint/restrict-template-expressions` | 664 |
| `@typescript-eslint/no-unsafe-type-assertion` | 584 |
| `@typescript-eslint/no-explicit-any` | 204 |
| `@typescript-eslint/no-unnecessary-condition` | 181 |
| `@typescript-eslint/no-unsafe-member-access` | 178 |
| `@typescript-eslint/no-unused-vars` | 157 |
| `@typescript-eslint/no-unsafe-assignment` | 130 |
| `@typescript-eslint/require-await` | 112 |
| `@typescript-eslint/no-unnecessary-type-assertion` | 100 |

## Playback Questions

1. Did aggregate Code Dojo debt fall to `3,940` or lower?
2. Did the stored ESLint baseline match the new live count?
3. Did file/context and code-size debt hold or shrink?
4. Did touched behavioral surfaces get focused validation?
5. Does `npm run code-dojo:ci` pass after the lower ceiling is installed?

## Tests To Write First

Pure static-analysis rewrites use the existing lint finding as RED and the
lower live count as GREEN. Add focused regression tests before changing runtime
behavior, helper contracts, parsing, scheduling, schema normalization, or user
visible rendering.

## Acceptance Criteria

- Aggregate Code Dojo debt is `3,940` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count
  and per-rule counts.
- `docs/code-dojo-exceptions.md` reports the lower aggregate debt count and
  next target.
- `package.json` lowers `code-dojo:debt --max` to the new live aggregate count.
- Focused tests for touched clusters pass.
- `npm run code-dojo:ci`, `npm run docs:inventory`, and `git diff --check`
  pass before final review.

## Retrospective

Completed with a measured aggregate Code Dojo debt reduction from `4,940` to
`3,859` (`-1,081`). The stored ESLint baseline now records `3,436` live
findings, down from `4,517` (`-1,081`), and the next aggregate target is
`3,809` or lower. The follow-on pass removed fake async wrappers, dead DAG
fixtures/imports, and implicit numeric template formatting while keeping
touched file/context budgets below their stored ceilings.
