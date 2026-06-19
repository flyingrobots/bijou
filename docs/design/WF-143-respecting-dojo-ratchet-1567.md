# WF-143 Respecting the Dojo Ratchet To 1564

## Status

Implemented.

## Issue

- GitHub Issue: [#391](https://github.com/flyingrobots/bijou/issues/391)

## Context

WF-142 landed the Respecting the Dojo burndown at `1,617` aggregate Code Dojo
violations. The next ratchet must cut at least `50` more violations and set the
ceiling to `1,567` or lower.

The active objective remains zero ESLint errors, zero Code Dojo
warnings/errors/issues, and zero length-restriction violations. This cycle is a
bounded cleanup slice toward that endpoint, not a reason to loosen standards or
shuffle exceptions.

## Goal

Reduce aggregate Code Dojo debt from `1,617` to `1,567` or lower by eliminating
at least `50` live ESLint findings with behavior-preserving TypeScript fixes.
The implemented slice reaches `1,564`.

## Candidate Slice

The implemented non-DOGFOOD package/script slice removes `52` live ESLint
findings while shrinking touched file/context ceilings:

| File | Findings |
| :--- | ---: |
| `packages/bijou-tui/src/runtime-engine.test.ts` | 13 |
| `scripts/dogfood-i18n-completeness.ts` | 12 |
| `packages/bijou-tui/src/driver.test.ts` | 11 |
| `packages/bijou/src/core/forms/select.ts` | 6 |
| `packages/bijou-tui/src/transition-shaders.test.ts` | 5 |
| `packages/bijou/src/core/render/packed-cell.test.ts` | 5 |
| **Implemented total** | **52** |

The final slice avoided partially-cleaned files because `code-dojo:changed`
requires touched files to be raw-ESLint clean.

## Scope

- Replace non-null assertions, unsafe assertions, `any` escapes, unchecked
  dynamic reads, and implicit interpolation with typed helpers, checked reads,
  explicit formatting, or narrowed runtime guards.
- Prefer local helper extraction only when it removes repeated unsafe patterns
  without increasing touched file/context debt.
- Preserve TUI runtime, AppFrame rendering, example smoke, and recorder
  behavior.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- ESLint rules, Code Dojo thresholds, hooks, and CI policy must not weaken.
- File/context, mock-ban, and code-size ceilings must not rise.
- DOGFOOD docs raw-string cleanup is out of scope for this slice unless it is
  deliberately chosen as the primary goalpost.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `b5774a4a`:

- aggregate Code Dojo debt: `1,617`
- ESLint findings: `1,206`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,567` or lower

Implemented counts on this branch:

- aggregate Code Dojo debt: `1,564`
- ESLint findings: `1,154`
- file/context baseline: `332`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,514` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,567` or lower?
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

- The selected touched TypeScript files reduce live ESLint findings by at least
  `50`.
- Aggregate Code Dojo debt is `1,567` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint
  count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
