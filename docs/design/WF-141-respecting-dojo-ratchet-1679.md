# WF-141 Respecting the Dojo Ratchet To 1679

## Status

Implemented.

## Issue

- GitHub Issue: [#387](https://github.com/flyingrobots/bijou/issues/387)

## Context

WF-140 landed the Respecting the Dojo burndown at `1,729` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,679` or lower.

The goal remains zero ESLint findings, zero Code Dojo warnings/errors/issues,
and zero length-restriction violations. This cycle is one real cleanup slice
toward that endpoint, not an exception shuffle.

## Goal

Reduce aggregate Code Dojo debt from `1,729` to `1,679` or lower by eliminating
at least `50` live ESLint findings with behavior-preserving TypeScript fixes.

## Final Slice

The implemented cleanup removes 58 live ESLint findings:

| File | Findings |
| :--- | ---: |
| `packages/bijou/src/core/theme/builder.ts` | 13 |
| `packages/bijou/src/core/theme/graph.ts` | 13 |
| `packages/bijou/src/core/components/dag-source.ts` | 13 |
| `scripts/image-viewer.test.ts` | 13 |
| `examples/image-viewer/main.ts` | 6 |
| **Slice total** | **58** |

The final slice added `examples/image-viewer/main.ts` because narrowing that
app's concrete surface-rendering return type removes unsafe surface assertions
from the image-viewer tests while preserving runtime behavior.

## Scope

- Replace non-null assertions, unsafe assertions, `any` escapes, and unchecked
  dynamic reads with typed helpers, checked reads, or narrowed runtime guards.
- Make numeric and unknown template interpolation explicit.
- Preserve theme-builder, theme-graph, DAG source, and image-viewer behavior.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, and standards artifacts must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD localization raw-copy cleanup is out of scope for this slice unless
  deliberately chosen as the primary goalpost.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `45462fae`:

- aggregate Code Dojo debt: `1,729`
- ESLint findings: `1,318`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,679` or lower

Implementation result:

- aggregate Code Dojo debt: `1,671`
- ESLint findings: `1,260`
- live ESLint reduction: `58`
- next aggregate target: `1,621` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,671` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context, mock-ban, and code-size ceilings stay flat or
   lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Run focused Code Dojo gates for the touched files.
- Run focused tests for the selected component, theme, and script surfaces.
- Run `npm run code-dojo:debt`.
- Run `npm run code-dojo:verify`.
- Run `npm run docs:inventory`.
- Run `npm run lint` and `npm run lint:eslint`.

## Acceptance Criteria

- The selected touched TypeScript files have zero new ESLint findings and reduce
  live findings by at least `50`.
- Aggregate Code Dojo debt is `1,671` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
