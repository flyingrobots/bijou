# WF-142 Respecting The Dojo Ratchet To 1621

## Status

Implemented.

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

## Final Slice

The implemented cleanup removes 54 live ESLint findings without touching
DOGFOOD docs source files:

| File | Findings |
| :--- | ---: |
| `packages/bijou-tui/src/notification.ts` | 13 |
| `packages/bijou/src/core/components/dag-layout.ts` | 10 |
| `packages/bijou/src/core/layout/flex.ts` | 10 |
| `packages/bijou/src/core/theme/color.ts` | 10 |
| `packages/bijou/src/core/theme/extend.ts` | 6 |
| `packages/bijou-tui/src/panel-dock.ts` | 3 |
| `packages/bijou-tui/src/surface-layout.ts` | 2 |
| **Slice total** | **54** |

The initial DOGFOOD docs candidate cluster was rejected because touching those
source files activates the DOGFOOD i18n raw-string debt gate. This slice stays
in package/core files and keeps touched file/context and code-size ceilings
flat or lower.

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

Implementation result:

- aggregate Code Dojo debt: `1,617`
- ESLint findings: `1,206`
- live ESLint reduction: `54`
- next aggregate target: `1,567` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,621` or lower?
2. Did the implementation remove at least `50` real violations?
3. Did touched file/context, mock-ban, and code-size ceilings stay flat or
   lower?
4. Did focused behavior tests for touched surfaces pass?

## Validation Plan

- Probe the selected files with focused Code Dojo gates.
- Run focused tests for touched package/core surfaces.
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
