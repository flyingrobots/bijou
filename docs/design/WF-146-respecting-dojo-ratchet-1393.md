# WF-146 Respecting the Dojo Ratchet To 1393

## Status

Shaped; pending implementation.

## Issue

- GitHub Issue: [#397](https://github.com/flyingrobots/bijou/issues/397)

## Context

WF-145 landed the Respecting the Dojo burndown at `1,443` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,393` or lower.

The active objective remains zero ESLint errors, zero Code Dojo
warnings/errors/issues, and zero length-restriction violations. This cycle is a
bounded cleanup slice toward that endpoint.

## Goal

Reduce aggregate Code Dojo debt from `1,443` to `1,393` or lower by eliminating
at least `50` live findings with behavior-preserving TypeScript fixes.

## Candidate Slice

The current ESLint offender list gives two plausible routes:

| Candidate | Findings | Notes |
| :--- | ---: | :--- |
| `examples/docs/app.ts` | 118 | Highest yield, but a large DOGFOOD docs surface with raw visible-copy policy risk. |
| `examples/docs/stories.ts` | 41 | High-yield template-formatting cleanup in a large DOGFOOD story surface. |
| `examples/docs/dogfood-blocks.ts` | 37 | High-yield DOGFOOD block cleanup with formatting and checked-read work. |
| Smaller package/test cluster | 50+ | Lower single-file yield, but can avoid broad DOGFOOD policy coupling. |

Implementation should choose the highest-yield slice that can pass the focused
Code Dojo and DOGFOOD gates without weakening standards. If DOGFOOD docs files
are touched, visible-copy policy failures are part of the work rather than an
excuse to raise baselines.

## Scope

- Replace unsafe assertions, non-null assertions, unchecked dynamic reads,
  fake async commands, stale unused values, and implicit interpolation with
  typed helpers, checked reads, explicit formatting, or narrowed runtime guards.
- Preserve DOGFOOD docs behavior, package runtime behavior, and public APIs.
- Lower ratchet artifacts only after live counts prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, hooks, and CI policy must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD visible-copy cleanup is in scope only for files deliberately touched
  by the selected slice.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `5eccfb69`:

- aggregate Code Dojo debt: `1,443`
- ESLint findings: `1,034`
- file/context baseline: `332`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,393` or lower

Implemented counts on this branch before review:

- pending

## Playback Questions

1. Is aggregate Code Dojo debt at `1,393` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context, mock-ban, and code-size ceilings stay flat or
   lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Probe the selected files with focused Code Dojo gates.
- Run focused tests for touched package/script/DOGFOOD surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `npm run lint:eslint`.

## Acceptance Criteria

- The selected touched TypeScript files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `1,393` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint
  count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
