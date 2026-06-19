# LX-023: DOGFOOD Blocks And Capture Ratchet

## Status

Shaped.

## Tracker

- Issue: [#419](https://github.com/flyingrobots/bijou/issues/419)
- Pull request: [#420](https://github.com/flyingrobots/bijou/pull/420)
- Branch: `cycle/dogfood-blocks-capture-ratchet-792`

## Current Truth

Live counts on `main` at `e33feaf1`:

- aggregate Code Dojo debt: `792`
- next aggregate Code Dojo target: `742` or lower
- ESLint findings: `384`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` hard-limit files
- DOGFOOD raw-string debt: `2,654`
- missing Markdown localization debt: `78`

Current offender evidence from `npm run code-dojo:eslint:offenders`:

- `examples/docs/dogfood-blocks.ts`: `37` ESLint findings
- `examples/docs/capture-main.ts`: `30` ESLint findings

The selected files can clear the required 50-count ratchet if fixed rather than
waived. `dogfood-blocks.ts` also carries legacy DOGFOOD raw strings, so any
touch to that file must respect the DOGFOOD i18n ratchet.

## Problem

The Code Dojo baseline is enforceable, but the repository is not yet living at
the standard. The remaining DOGFOOD block and capture surfaces still rely on
unsafe casts, implicit string formatting, unchecked reads, and raw user-facing
strings. They are also product-facing proof surfaces, so cleanup must preserve
rendered behavior and lower-mode truth instead of applying mechanical lint
silencing.

## Scope

- Remove at least `50` counted ESLint findings from the selected DOGFOOD block
  and capture cluster.
- Prefer checked reads, local type guards, explicit `String(...)` formatting,
  and precise return types over assertions.
- Replace touched raw DOGFOOD strings with catalog-backed lookups when that is
  the honest local fix.
- Update measured baselines only after validation proves the new counts.
- Update Code Dojo and changelog documentation with landed numbers.

## Out Of Scope

- Broad DOGFOOD app redesign.
- New standard block contracts.
- Release tagging.
- Adding new exceptions for current violations.
- Cosmetic copy changes unrelated to standards cleanup.

## Implementation Notes

The first pass should inspect lint output for the two selected files and group
fixes by behavior:

- explicit formatting for numeric and unknown template values
- removal of unnecessary type arguments and unnecessary conversions
- safe external-data narrowing in capture code
- non-null assertion removal around arrays, map lookups, and metadata reads
- raw-string replacement only where the touched code already has localization
  context available or can be given one without widening architecture

If the selected files cannot clear the full target without risky churn, add the
next highest small offender only after documenting the reason in this file.

## Validation Plan

- `npx eslint examples/docs/dogfood-blocks.ts examples/docs/capture-main.ts`
- `npm run code-dojo:changed`
- `npm run code-dojo:debt`
- `npm run dogfood:i18n:complete`
- `npm run dogfood:i18n:check`
- `npm run dogfood:i18n:debt`
- relevant focused tests or DOGFOOD smoke checks selected from the diff
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`
- full pre-push gate

## Acceptance Criteria

- Aggregate Code Dojo debt is `742` or lower.
- ESLint baseline is `334` or lower.
- Touched DOGFOOD i18n debt does not increase and is reduced where source
  strings are replaced with catalog-backed lookup.
- Touched files remain under their current file/context baselines.
- Issue #419, this design doc, and the pull request are cross-linked.
