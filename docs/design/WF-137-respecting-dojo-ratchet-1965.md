---
title: WF-137 Respecting the Dojo Ratchet To 1965
legend: WF
lane: bad-code
priority: high
github_issue: 379
status: complete
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - respectful-repo
---

# WF-137 Respecting the Dojo Ratchet To 1965

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#379](https://github.com/flyingrobots/bijou/issues/379)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)

## Decision Summary

WF-136 merged with aggregate Code Dojo debt at `2,015`, including `1,603`
type-aware ESLint findings. The repo goal remains zero ESLint errors, zero Code
Dojo issues, and zero files violating length restrictions. The ratchet policy
requires every met goalpost to remove at least 50 counted violations until zero.

This cycle targets the next ratchet: lower aggregate debt from `2,015` to
`1,965` or lower without weakening rules, excluding files, or raising any
baseline.

## Sponsored Human

A maintainer wants the post-merge Dojo loop to keep moving while the next target
is fresh and the local iteration path is still warm.

## Sponsored Agent

An agent needs a small, non-DOGFOOD cleanup cluster that clears the next
50-count ratchet without pulling the localization debt gate into unrelated
source edits.

## Hill

Reduce aggregate Code Dojo debt from `2,015` to `1,965` or lower by eliminating
at least `50` live ESLint findings from non-DOGFOOD package or test files.

Current candidates from the offender list:

| File | Findings |
| :--- | ---: |
| `packages/bijou/src/core/theme/dtcg.ts` | 20 |
| `packages/bijou-tui/src/pipeline/pipeline.ts` | 18 |
| `packages/bijou-tui/src/canvas.ts` | 17 |
| `packages/bijou-i18n-tools/src/exchange.ts` | 15 |
| **Candidate total** | **70** |

The final slice may substitute equivalent non-DOGFOOD files if a candidate
would require broader semantic work than the goalpost warrants.

## Scope

- Replace unsafe theme-token and pipeline assertions with explicit guards or
  narrower local types.
- Replace assertion-based array/object reads with checked reads or direct value
  iteration.
- Make template interpolation explicit where values are not statically strings.
- Keep rendering, pipeline, and i18n exchange behavior stable.
- Lower `scripts/code-dojo/baselines/eslint.json`, `docs/code-dojo-exceptions.md`,
  and `package.json` only after live counts prove the reduction.

## Non-Goals

- Leave the 5,000-line DOGFOOD app untouched in this slice.
- Keep ESLint rules and Code Dojo thresholds at full strength.
- Preserve file/context and code-size ceilings.
- Avoid architectural rewrites outside the selected cleanup files.

## Current Evidence

Live counts on `main` at `e6c8bdd1`:

- aggregate Code Dojo debt: `2,015`
- ESLint findings: `1,603`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `56`, including `4` legacy hard-limit files
- next aggregate target: `1,965` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,965` or lower?
2. Does the stored ESLint baseline match the new live count?
3. Have file/context and code-size debt held or shrunk?
4. Do focused tests for the touched surfaces pass?
5. Are the repo gates passing before review?

## Tests To Write First

The lint findings are the RED signal for pure type-safety rewrites. Add focused
regression tests before changing rendering, pipeline execution, or i18n exchange
behavior.

## Acceptance Criteria

- The selected touched TypeScript files have zero new ESLint findings and reduce
  live findings by at least `50`.
- Aggregate Code Dojo debt is `1,965` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
- `npm run code-dojo:verify`, `npm run docs:inventory`, `npm run lint`, and
  `git diff --check` pass before review.

## Retrospective

Completed with aggregate Code Dojo debt reduced from `2,015` to `1,963`
(`-52`). The stored ESLint baseline now records `1,551` live findings, down
from `1,603`, and the next aggregate target is `1,913` or lower.

The implementation cleaned three non-DOGFOOD files:

- `packages/bijou/src/core/theme/dtcg.ts` now treats imported DTCG documents as
  unknown-shaped records and validates token, modifier, RGB, group, and JSON
  reads locally instead of casting external payloads into narrower types.
- `packages/bijou-tui/src/canvas.ts` now uses `unknown` shader uniforms,
  preserves packed-surface narrowing directly, computes UV denominators
  explicitly, and removes assertion-based Braille dot reads.
- `packages/bijou-i18n-tools/src/exchange.ts` now validates serialized exchange
  value kinds before decoding, keeps external version fields checkable, and
  derives workbook row typing from the column manifest.

Touched file/context budgets held or shrank: `dtcg.ts` is now `291` lines /
`9,587` bytes against a `347` / `12,346` baseline, `canvas.ts` is now `356`
lines / `10,895` bytes against a `377` / `11,295` baseline, and `exchange.ts`
is now `344` lines / `11,440` bytes against a `361` / `11,459` baseline.
