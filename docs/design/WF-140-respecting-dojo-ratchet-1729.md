# WF-140 Respecting the Dojo Ratchet To 1729

## Status

Implemented.

## Issue

- GitHub Issue: [#385](https://github.com/flyingrobots/bijou/issues/385)

## Context

WF-139 landed the Respecting the Dojo burndown at `1,779` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,729` or lower.

The goal remains zero ESLint findings, zero Code Dojo warnings/errors/issues,
and zero length-restriction violations. This cycle is one real cleanup slice
toward that endpoint, not an exception shuffle.

## Goal

Reduce aggregate Code Dojo debt from `1,779` to `1,729` or lower by eliminating
at least `50` live ESLint findings with behavior-preserving TypeScript fixes.

## Final Slice

The implemented cleanup removes exactly 50 live ESLint findings:

| File | Findings |
| :--- | ---: |
| `examples/perf-gradient/main.ts` | 24 |
| `packages/bijou/src/core/components/dag-edges.test.ts` | 12 |
| `packages/bijou/src/core/components/box.test.ts` | 12 |
| `packages/bijou/src/core/components/perf-overlay.ts` | 2 |
| **Slice total** | **50** |

The DOGFOOD capture candidate is intentionally deferred because touching that
source currently activates a broader DOGFOOD i18n raw-copy cleanup than this
goalpost should carry.

## Scope

- Replace non-null assertions, unsafe assertions, and `any` escapes with checked
  reads, typed helpers, or narrowed runtime guards.
- Make numeric and unknown template interpolation explicit.
- Preserve perf-gradient and component behavior.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, and standards artifacts must not weaken.
- File/context and code-size ceilings must not rise.
- Broad DOGFOOD architecture rewrites are out of scope.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `7e029df7`:

- aggregate Code Dojo debt: `1,779`
- ESLint findings: `1,368`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,729` or lower

Implementation result:

- aggregate Code Dojo debt: `1,729`
- ESLint findings: `1,318`
- live ESLint reduction: `50`
- next aggregate target: `1,679` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,729` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context and code-size ceilings stay flat or lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Run focused Code Dojo gates for the touched files.
- Run focused tests for the selected component surfaces.
- Run `npm run code-dojo:debt`.
- Run `npm run code-dojo:verify`.
- Run `npm run lint` and `npm run lint:eslint`.

## Acceptance Criteria

- The selected touched TypeScript files have zero new ESLint findings and reduce
  live findings by at least `50`.
- Aggregate Code Dojo debt is `1,729` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
