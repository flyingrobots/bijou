# WF-142 Respecting The Dojo Ratchet To 1621

## Status

Shaping.

## Issue

- GitHub Issue: [#389](https://github.com/flyingrobots/bijou/issues/389)

## Context

WF-141 landed the Respecting the Dojo burndown at `1,671` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,621` or lower.

The active objective remains zero ESLint errors, zero Code Dojo
warnings/errors/issues, and zero length-restriction violations. This cycle is a
bounded cleanup slice toward that endpoint, not a reason to loosen standards or
shuffle exceptions.

## Goal

Reduce aggregate Code Dojo debt from `1,671` to `1,621` or lower by eliminating
at least `50` live ESLint findings with behavior-preserving TypeScript fixes.

## Candidate Slice

The current highest-yield ESLint offenders are clustered in DOGFOOD
docs/example surfaces:

| File | Findings |
| :--- | ---: |
| `examples/docs/app.ts` | 118 |
| `examples/docs/stories.ts` | 41 |
| `examples/docs/dogfood-blocks.ts` | 37 |
| `examples/docs/capture-main.ts` | 30 |
| `examples/_shared/canonical-app.ts` | 25 |
| `tests/cycles/LX-008/localized-shell-and-dogfood.test.ts` | 24 |

The implementation should choose the smallest coherent cluster that can remove
at least `50` live findings while keeping touched files at or below their
stored file/context ceilings.

## Scope

- Replace non-null assertions, unsafe assertions, `any` escapes, unchecked
  dynamic reads, and implicit interpolation with typed helpers, checked reads,
  explicit formatting, or narrowed runtime guards.
- Prefer local helper extraction only when it removes repeated unsafe patterns
  without increasing touched file/context debt.
- Preserve DOGFOOD docs/example runtime behavior.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, hooks, and CI policy must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD product behavior, localization policy, and demo content are not being
  redesigned in this slice.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `082342b3`:

- aggregate Code Dojo debt: `1,671`
- ESLint findings: `1,260`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,621` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,621` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context, mock-ban, and code-size ceilings stay flat or
   lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Probe the selected files with focused Code Dojo gates.
- Run focused tests for touched DOGFOOD docs/example surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `npm run lint:eslint`.

## Acceptance Criteria

- The selected touched TypeScript files reduce live ESLint findings by at least
  `50`.
- Aggregate Code Dojo debt is `1,621` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint
  count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
