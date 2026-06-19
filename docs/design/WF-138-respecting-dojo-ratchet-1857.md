---
title: WF-138 Respecting the Dojo Ratchet To 1857
legend: WF
lane: bad-code
priority: high
github_issue: 381
status: in_progress
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - respectful-repo
---

# WF-138 Respecting the Dojo Ratchet To 1857

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#381](https://github.com/flyingrobots/bijou/issues/381)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)

## Decision Summary

WF-137 merged with aggregate Code Dojo debt at `1,907`, including `1,495`
type-aware ESLint findings. The repo goal remains zero ESLint errors, zero Code
Dojo issues, and zero files violating length restrictions. The ratchet policy
requires every met goalpost to remove at least 50 counted violations until zero.

This cycle targets the next ratchet: lower aggregate debt from `1,907` to
`1,857` or lower without weakening rules, excluding files, or raising any
baseline.

## Sponsored Human

A maintainer wants the Respecting the Dojo loop to keep turning after WF-137
landed rather than letting the next `50` violations become background noise.

## Sponsored Agent

An agent needs a compact cleanup cluster with enough current ESLint density to
clear the next goalpost while preserving touched-file size ratchets.

## Hill

Reduce aggregate Code Dojo debt from `1,907` to `1,857` or lower by eliminating
at least `50` live ESLint findings with real fixes.

Final non-DOGFOOD slice from the offender list:

| File | Findings |
| :--- | ---: |
| `bench/src/soak-runner.ts` | 16 |
| `packages/bijou/src/core/components/markdown-render.ts` | 16 |
| `packages/bijou/src/core/forms/textarea-editor.ts` | 14 |
| `scripts/record-gifs.ts` | 15 |
| **Slice total** | **61** |

The initial broader candidate list stayed flexible so this goalpost could avoid
larger semantic work in layout IR and active-binding contracts.

## Implementation Result

The final slice lowered live type-aware ESLint findings from `1,495` to
`1,434`, reducing aggregate Code Dojo debt from `1,907` to `1,846`. The cleanup
kept file/context and code-size counts flat while replacing unchecked scenario,
wrapped-line, editor-line, queue, and dynamic-recorder reads with checked
access.

## Scope

- Replace non-null assertions and unsafe assertions with checked reads,
  structural guards, or narrowed helper functions.
- Make template interpolation explicit where values are not statically strings.
- Remove stale or redundant conditionals only when behavior is preserved.
- Keep rendering, layout, active-binding, benchmark, and markdown behavior
  stable.
- Lower `scripts/code-dojo/baselines/eslint.json`,
  `docs/code-dojo-exceptions.md`, and `package.json` only after live counts
  prove the reduction.

## Non-Goals

- Do not weaken ESLint rules, Code Dojo thresholds, or standards artifacts.
- Do not raise file/context or code-size ceilings.
- Do not refactor unrelated rendering or layout architecture.
- Do not rely on exception churn in place of real cleanup.

## Current Evidence

Live counts on `main` at `52230bc5`:

- aggregate Code Dojo debt: `1,907`
- ESLint findings: `1,495`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `56`, including `4` legacy hard-limit files
- next aggregate target: `1,857` or lower

Live counts after the implementation slice:

- aggregate Code Dojo debt: `1,846`
- ESLint findings: `1,434`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `56`, including `4` legacy hard-limit files
- next aggregate target: `1,796` or lower

## Playback Questions

1. Is aggregate Code Dojo debt at `1,857` or lower?
2. Does the stored ESLint baseline match the new live count?
3. Have file/context and code-size debt held or shrunk?
4. Do focused tests for the touched surfaces pass?
5. Are the repo gates passing before review?

## Tests To Write First

The lint findings are the RED signal for pure type-safety rewrites. Add focused
regression tests before changing behavior in rendering, layout, active binding,
or benchmark execution.

## Acceptance Criteria

- The selected touched TypeScript files have zero new ESLint findings and reduce
  live findings by at least `50`.
- Aggregate Code Dojo debt is `1,846` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched surfaces passes.
- `npm run code-dojo:verify`, `npm run docs:inventory`, `npm run lint`, and
  `git diff --check` pass before review.
