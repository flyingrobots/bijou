---
title: WF-136 Respecting the Dojo Ratchet To 2018
legend: WF
lane: bad-code
priority: high
github_issue: 377
status: complete
keywords:
  - code-dojo
  - eslint
  - standards
  - ratchet
  - respectful-repo
---

# WF-136 Respecting the Dojo Ratchet To 2018

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-delivery.md)

## Linked Work

- Issue: [#377](https://github.com/flyingrobots/bijou/issues/377)
- Standards artifact:
  [TypeScript Code Standards Editor's Edition](../typescript-code-standards.editors-edition.md)
- Exception ledger:
  [Code Dojo Exceptions](../code-dojo-exceptions.md)

## Decision Summary

WF-135 merged with aggregate Code Dojo debt at `2,068`, including `1,656`
type-aware ESLint findings. The standing goal remains zero ESLint errors, zero
Code Dojo issues, and zero files violating length restrictions. The current
goalpost policy requires every met goalpost to remove at least 50 counted
violations until the repository reaches zero.

This cycle targets the next ratchet: lower aggregate debt from `2,068` to
`2,018` or lower without weakening rules, excluding files, or raising any
baseline.

## Sponsored Human

A maintainer wants each follow-on Dojo slice to keep earning the standards
instead of letting the post-1000 burndown stall at a still-large exception
ledger.

## Sponsored Agent

An agent needs a narrow, mechanically reviewable target that clears the next
50-count ratchet while avoiding broad edits to the largest DOGFOOD files.

## Hill

Reduce aggregate Code Dojo debt from `2,068` to `2,018` or lower by eliminating
the current `53` ESLint findings in:

- `packages/bijou-node/src/worker/worker.ts` (`21` findings)
- `packages/bijou/src/core/components/dag-render.ts` (`20` findings)
- `packages/bijou/src/core/components/preference-list.ts` (`12` findings)

## Scope

- Replace unsafe `any` and unsafe assertion handoffs with explicit message,
  command, and worker-data contracts.
- Replace non-null assertions around worker IPC with local parent-port guards.
- Replace DAG renderer array assumptions with direct iteration, guarded reads,
  and explicit string formatting.
- Replace preference-list index assertions with value iteration and remove the
  dead height assignment.
- Keep worker-thread, DAG rendering, and preference-list behavior stable.
- Lower `scripts/code-dojo/baselines/eslint.json`, `docs/code-dojo-exceptions.md`,
  and `package.json` only after live counts prove the reduction.

## Non-Goals

- Do not touch the 5,000-line DOGFOOD app in this slice.
- Do not soften, disable, or narrow ESLint rules.
- Do not raise file/context or code-size ceilings.
- Do not change worker lifecycle semantics for static-analysis convenience.

## Current Evidence

Live counts on `main` at `ec943706`:

- aggregate Code Dojo debt: `2,068`
- ESLint findings: `1,656`
- file/context baseline: `333`
- mock-ban baseline: `23`
- code-size baseline: `56`, including `4` legacy hard-limit files
- next aggregate target: `2,018` or lower

Focused ESLint findings:

| File | Findings |
| :--- | ---: |
| `packages/bijou-node/src/worker/worker.ts` | 21 |
| `packages/bijou/src/core/components/dag-render.ts` | 20 |
| `packages/bijou/src/core/components/preference-list.ts` | 12 |
| **Total** | **53** |

## Playback Questions

1. Did aggregate Code Dojo debt fall to `2,018` or lower?
2. Did the stored ESLint baseline match the new live count?
3. Did file/context and code-size debt hold or shrink?
4. Did worker, DAG renderer, and preference-list focused tests pass?
5. Did the repo gates pass before review?

## Tests To Write First

The lint findings are the RED signal for pure type-safety rewrites. Add focused
regression tests before changing worker lifecycle behavior, message routing,
DAG rendering behavior, or preference-list layout.

## Acceptance Criteria

- `packages/bijou-node/src/worker/worker.ts` has zero ESLint findings.
- `packages/bijou/src/core/components/dag-render.ts` has zero ESLint findings.
- `packages/bijou/src/core/components/preference-list.ts` has zero ESLint
  findings.
- Aggregate Code Dojo debt is `2,018` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched worker, DAG renderer, and preference-list
  surfaces passes.
- `npm run code-dojo:verify`, `npm run docs:inventory`, `npm run lint`, and
  `git diff --check` pass before review.

## Retrospective

Completed with aggregate Code Dojo debt reduced from `2,068` to `2,015`
(`-53`). The stored ESLint baseline now records `1,603` live findings, down
from `1,656`, and the next aggregate target is `1,965` or lower.

The implementation cleaned the targeted worker IPC and component rendering
files:

- `packages/bijou-node/src/worker/worker.ts` now reads worker data through a
  typed guard, narrows `parentPort` once, and validates raw worker IPC messages
  before dispatching them into proxy I/O handlers.
- `packages/bijou-node/src/worker/worker-data.ts` keeps worker-data validation
  out of the already-baselined worker runtime file.
- `packages/bijou/src/core/components/dag-render.ts` now iterates rendered
  graphemes and layer arrays without non-null assertions and formats accessible
  counts explicitly.
- `packages/bijou/src/core/components/preference-list.ts` now iterates value,
  description, section, row, and output character arrays directly without
  assertion-based indexing.

Touched file/context budgets held or shrank: `worker.ts` is now `318` lines /
`10,676` bytes against a `334` / `11,496` baseline, `dag-render.ts` is now
`692` lines / `25,039` bytes against a `693` / `25,088` baseline, and
`preference-list.ts` is now `420` lines / `13,876` bytes against a `425` /
`14,249` baseline.
