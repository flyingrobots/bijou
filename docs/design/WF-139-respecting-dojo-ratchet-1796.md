---
title: WF-139 Respecting the Dojo Ratchet To 1796
legend: WF
lane: bad-code
priority: high
github_issue: 383
status: in_progress
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - respectful-repo
---

# WF-139 Respecting the Dojo Ratchet To 1796

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#383](https://github.com/flyingrobots/bijou/issues/383)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)

## Decision Summary

WF-138 merged with aggregate Code Dojo debt at `1,846`, including `1,434`
type-aware ESLint findings. The repo goal remains zero ESLint errors, zero Code
Dojo issues, and zero files violating length restrictions. The ratchet policy
requires every met goalpost to remove at least 50 counted violations until zero.

This cycle targets the next ratchet: lower aggregate debt from `1,846` to
`1,796` or lower without weakening rules, excluding files, or raising any
baseline.

## Sponsored Human

A maintainer wants the Dojo loop to keep moving immediately after WF-138 rather
than parking a ready burndown on main and letting the next 50 violations linger.

## Sponsored Agent

An agent needs a bounded cluster with enough current ESLint density to clear the
next goalpost while keeping touched-file size ratchets flat or lower.

## Hill

Reduce aggregate Code Dojo debt from `1,846` to `1,796` or lower by eliminating
at least `50` live ESLint findings with real fixes.

Final non-DOGFOOD slice from the offender list:

| File | Findings |
| :--- | ---: |
| `packages/bijou/src/core/ui-scene-ir.ts` | 17 |
| `packages/bijou/src/core/active-binding-collection.ts` | 16 |
| `packages/bijou/src/core/layout/envelope.ts` | 16 |
| `packages/bijou-tui/src/flex.ts` | 13 |
| **Slice total** | **62** |

## Implementation Result

The final slice lowered live type-aware ESLint findings from `1,434` to
`1,368` and removed `packages/bijou-tui/src/flex.ts` from the code-size
baseline by shrinking it to the 500-line ratchet boundary. Aggregate Code Dojo
debt fell from `1,846` to `1,779`.

## Scope

- Replace non-null assertions and unsafe assertions with checked reads,
  structural guards, or narrowed helper functions.
- Make template interpolation explicit where values are not statically strings.
- Remove stale or redundant conditionals only when behavior is preserved.
- Keep UI scene IR hashing/lowering, active-binding collection behavior, layout
  envelope negotiation, and TUI flex behavior stable.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- Weakening ESLint rules, Code Dojo thresholds, or standards artifacts is out
  of scope.
- File/context and code-size ceilings must not rise.
- Unrelated rendering or layout architecture refactors are out of scope.
- Exception churn cannot stand in for real cleanup.

## Current Evidence

Live counts on `main` at `f820fc07`:

- aggregate Code Dojo debt: `1,846`
- ESLint findings: `1,434`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `56`, including `4` legacy hard-limit files
- next aggregate target: `1,796` or lower

Live counts after the implementation slice:

- aggregate Code Dojo debt: `1,779`
- ESLint findings: `1,368`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `1,729` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,796` or lower?
2. Does the stored ESLint baseline match the new live count?
3. Have file/context and code-size debt held or shrunk?
4. Do focused tests for the touched surfaces pass?
5. Are the repo gates passing before review?

## Tests To Write First

The lint findings are the RED signal for pure type-safety rewrites. Add focused
regression tests before changing behavior in UI scene lowering, active binding,
layout envelope resolution, or flex layout.

## Acceptance Criteria

- The selected touched TypeScript files have zero new ESLint findings and reduce
  live findings by at least `50`.
- Aggregate Code Dojo debt is `1,779` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
- `npm run code-dojo:verify`, `npm run docs:inventory`, `npm run lint`, and
  `git diff --check` pass before review.
