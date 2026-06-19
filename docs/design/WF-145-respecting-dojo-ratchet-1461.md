# WF-145 Respecting the Dojo Ratchet To 1461

## Status

Implemented; pending review.

## Issue

- GitHub Issue: [#395](https://github.com/flyingrobots/bijou/issues/395)

## Context

WF-144 landed the Respecting the Dojo burndown at `1,511` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,461` or lower.

The active objective remains zero ESLint errors, zero Code Dojo
warnings/errors/issues, and zero length-restriction violations. This cycle is a
bounded cleanup slice toward that endpoint.

## Goal

Reduce aggregate Code Dojo debt from `1,511` to `1,461` or lower by eliminating
at least `50` live findings with behavior-preserving TypeScript fixes.

## Selected Slice

The implementation used a non-DOGFOOD package/script/test cluster that avoided
DOGFOOD raw visible-copy policy work, removed `63` live ESLint findings, and
retired one mock-ban violation:

| File | Findings |
| :--- | ---: |
| `scripts/smoke-all-examples-lib.ts` | 12 |
| `bench/src/harnesses/wall-time/runner.ts` | 11 |
| `packages/bijou-tui/src/types.ts` | 11 |
| `packages/bijou/src/core/theme/dtcg.test.ts` | 11 |
| `packages/bijou/src/core/app-shell-composition.test.ts` | 10 |
| command-contract follow-up cleanup | 8 |
| **Selected total** | **63** |

The selected cluster leaves every touched file raw-ESLint clean and at or below
its stored file/context ceiling. The implementation intentionally avoided
`packages/bijou-tui/src/app-frame-types.ts` and
`packages/bijou-node/src/recorder.ts` because the former has a deliberate
frame-scoped generic bridge and the latter needs broader recorder module
validation than this bounded slice should carry.

## Scope

- Replace unsafe assertions, unused parameters, fake async commands, unchecked
  dynamic reads, and implicit interpolation with typed helpers, checked reads,
  explicit formatting, or narrowed runtime guards.
- Preserve app-frame message contracts, example smoke orchestration, wall-time
  benchmark output, recorder behavior, and public TUI command types.
- Lower ratchet artifacts only after live counts prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, hooks, and CI policy must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD raw visible-copy cleanup is out of scope for this slice unless it is
  deliberately chosen as the primary goalpost.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `f279b6d2`:

- aggregate Code Dojo debt: `1,511`
- ESLint findings: `1,101`
- file/context baseline: `332`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,461` or lower

Implemented counts on this branch before review:

- aggregate Code Dojo debt: `1,447`
- ESLint findings: `1,038`
- file/context baseline: `332`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,397` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,461` or lower?
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
- Aggregate Code Dojo debt is `1,461` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint
  count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
