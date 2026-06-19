---
title: WF-136 Respecting the Dojo Ratchet To 2018
legend: WF
lane: bad-code
priority: high
github_issue: 377
status: active
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
the current `51` ESLint findings in:

- `examples/docs/capture-main.ts` (`30` findings)
- `packages/bijou-node/src/worker/worker.ts` (`21` findings)

## Scope

- Replace unsafe `any` and unsafe assertion handoffs with explicit message,
  command, and worker-data contracts.
- Replace non-null assertions around worker IPC with local parent-port guards.
- Remove stale unnecessary conditions and unnecessary type assertions.
- Keep capture autoplay and worker-thread behavior stable.
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
| `examples/docs/capture-main.ts` | 30 |
| `packages/bijou-node/src/worker/worker.ts` | 21 |
| **Total** | **51** |

## Playback Questions

1. Did aggregate Code Dojo debt fall to `2,018` or lower?
2. Did the stored ESLint baseline match the new live count?
3. Did file/context and code-size debt hold or shrink?
4. Did capture and worker focused tests pass?
5. Did the repo gates pass before review?

## Tests To Write First

The lint findings are the RED signal for pure type-safety rewrites. Add focused
regression tests before changing worker lifecycle behavior, capture scheduling,
message routing, or runtime viewport handling.

## Acceptance Criteria

- `examples/docs/capture-main.ts` has zero ESLint findings.
- `packages/bijou-node/src/worker/worker.ts` has zero ESLint findings.
- Aggregate Code Dojo debt is `2,018` or lower.
- `scripts/code-dojo/baselines/eslint.json` records the lower live ESLint count.
- `docs/code-dojo-exceptions.md` and `package.json` report the lower ceiling.
- Focused validation for the touched capture and worker surfaces passes.
- `npm run code-dojo:verify`, `npm run docs:inventory`, `npm run lint`, and
  `git diff --check` pass before review.
