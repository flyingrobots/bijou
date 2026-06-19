# WF-144 Respecting the Dojo Ratchet To 1514

## Status

Shaping.

## Issue

- GitHub Issue: [#393](https://github.com/flyingrobots/bijou/issues/393)

## Context

WF-143 landed the Respecting the Dojo burndown at `1,564` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,514` or lower.

The active objective remains zero ESLint errors, zero Code Dojo
warnings/errors/issues, and zero length-restriction violations. This cycle is a
bounded cleanup slice toward that endpoint, not a license to widen baselines or
move exceptions around.

## Goal

Reduce aggregate Code Dojo debt from `1,564` to `1,514` or lower by eliminating
at least `50` live findings with behavior-preserving TypeScript fixes.

## Candidate Slice

The current non-DOGFOOD package/script offenders include enough coherent debt
to meet the ratchet without touching DOGFOOD docs source files:

| File | Findings |
| :--- | ---: |
| `packages/bijou-tui/src/app-frame-render.ts` | 12 |
| `packages/bijou-tui/src/app-frame-types.ts` | 12 |
| `scripts/smoke-all-examples-lib.ts` | 12 |
| `bench/src/harnesses/wall-time/runner.ts` | 11 |
| `packages/bijou-node/src/recorder.ts` | 11 |
| **Candidate total** | **58** |

The implementation should choose the smallest coherent cluster that can remove
at least `50` live findings while leaving every touched file raw-ESLint clean
and at or below its stored file/context ceiling.

## Scope

- Replace non-null assertions, unsafe assertions, `any` escapes, unchecked
  dynamic reads, and implicit interpolation with typed helpers, checked reads,
  explicit formatting, or narrowed runtime guards.
- Prefer local helper extraction only when it removes repeated unsafe patterns
  without increasing touched file/context debt.
- Preserve TUI app-frame rendering, scoped message wrapping, recorder behavior,
  smoke example orchestration, and bench runner output.
- Lower ratchet artifacts only after live counts prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, hooks, and CI policy must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD docs raw-string cleanup is out of scope for this slice unless it is
  deliberately chosen as the primary goalpost.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `1159ba39`:

- aggregate Code Dojo debt: `1,564`
- ESLint findings: `1,154`
- file/context baseline: `332`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,514` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,514` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context, mock-ban, and code-size ceilings stay flat or
   lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Probe the selected files with focused Code Dojo gates.
- Run focused tests for touched package/script surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `npm run lint:eslint`.

## Acceptance Criteria

- The selected touched TypeScript files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `1,514` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint
  count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
