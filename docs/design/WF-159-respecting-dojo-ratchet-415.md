# WF-159 Respecting the Dojo Ratchet To 415

## Status

Implemented.

## Tracker

- GitHub Issue: [#431](https://github.com/flyingrobots/bijou/issues/431)
- Pull Request: [#432](https://github.com/flyingrobots/bijou/pull/432)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Bijou earns the next Code Dojo checkpoint by removing at least 50 counted
standards violations from the landed `main` ceiling without weakening the
Respectful Repo: Enter the Code Dojo direction.

## Current Truth

Live counts on `main` at `587776d7`:

- aggregate Code Dojo debt: `465`
- ESLint findings: `57`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `415` or lower

Top current ESLint offender clusters:

- `packages/bijou-i18n/src/runtime.ts`: `9`
- `scripts/pr-review-status.ts`: `4`
- `packages/bijou/src/core/forms/group.ts`: `2`
- `packages/bijou/src/core/graphql-bijou-block.test.ts`: `2`
- `packages/bijou/src/core/selection.ts`: `2`
- `packages/bijou/src/core/theme/index.ts`: `2`
- `packages/bijou/src/core/theme/resolve.test.ts`: `2`
- `packages/bijou/src/core/theme/resolve.ts`: `2`
- `packages/bijou/src/index.ts`: `2`
- `scripts/design-system-docs-preflight.ts`: `2`
- `tests/cycles/DF-070/dogfood-block-product-polish.test.ts`: `2`

The remaining lint debt is small enough to attempt a full ESLint clearout in
this cycle before moving into file/context and code-size debt.

## Implementation Notes

WF-159 removes `51` live type-aware ESLint findings, lowering the ESLint
baseline from `57` to `6` and the aggregate Code Dojo ceiling from `465` to
`414`.

Cleanup clusters:

- i18n runtime and localization port: remove unchecked caller-selected generic
  value claims from the runtime boundary, return unknown catalog data until a
  caller narrows it, and make interpolation avoid implicit object
  stringification.
- Tests and fixtures: replace scattered non-null assertions, unsafe matcher
  assignments, malformed active-binding input casts, fuzz fixture casts, and
  deterministic clock conditionals with typed guards or explicit runtime
  invocation.
- Theme and TUI helpers: make browsable-list render options generic, resolve
  theme status tokens through map lookups, preserve deprecated helper exports
  through star re-exports, and avoid unsafe token-graph casts.
- Script and parser utilities: validate package metadata JSON, parse
  design-system headings/fields with checked captures, and keep PR-status
  helper debt isolated for a later split.

Per the operator's temporary waiver for touched-file size ratchets, existing
file/context entries for touched legacy-large files were refreshed to their
current measured line/byte counts, and existing code-size ceilings for the
touched i18n runtime files were refreshed as well. No new counted
file/context, mock-ban, or code-size entries were added.

## Scope

- Select focused cleanup clusters from current ESLint or Code Dojo offenders.
- Prefer real type, data-shape, deterministic-test, and control-flow fixes over
  suppressions or cosmetic baseline churn.
- Continue shrinking oversized files when that contributes to the same
  standards objective.
- Keep counted file/context, mock-ban, code-size, and DOGFOOD localization
  totals flat or lower. If the operator explicitly waives touched-file size
  ratchets, record any refreshed legacy-large ceilings in this design doc.
- Update `scripts/code-dojo/baselines/eslint.json`, `package.json`,
  `docs/code-dojo-exceptions.md`, and `docs/CHANGELOG.md` after the live count
  is proven lower.

## Non-Goals

- No new file/context, mock-ban, or code-size entries.
- No release-version scope.
- No broad feature work.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Is aggregate Code Dojo debt at `415` or lower?
2. Did the implementation remove at least `50` real counted violations?
3. Did counted file/context, mock-ban, code-size, and DOGFOOD localization
   totals stay flat or lower, and were any waived size-ceiling refreshes
   recorded?
4. Did focused tests for touched behavior pass?
5. Did any large-file extraction preserve visible or API behavior?

## Accessibility And Assistive Posture

This is standards cleanup. Any touched rendered or terminal output must preserve
existing text, focus, lower-mode, and screen-reader semantics unless a test
explicitly proves an accessibility improvement.

## Localization And Directionality Posture

Avoid DOGFOOD copy edits unless the slice intentionally updates localization
catalogs. If DOGFOOD-facing strings are touched, run the DOGFOOD i18n gates and
hold the raw-string and missing-localization ratchets flat or lower.

## Agent Inspectability And Explainability Posture

The selected files, rule deltas, and validation commands must be captured in
this design doc or the PR summary so the next agent can audit what changed
without re-running broad discovery first.

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`

## Implementation Outline

1. Use `npm run code-dojo:eslint:offenders` and focused ESLint probes to select
   enough cleanup to remove at least `50` findings.
2. Prioritize zero remaining ESLint findings if the fixes stay behaviorally
   tight.
3. Write focused regressions only where cleanup exposes a behavior or module
   boundary risk.
4. Ratchet the ESLint baseline and aggregate Code Dojo ceiling after the live
   count is proven lower.
5. Update docs and changelog with final counts and the next target.

## Tests To Write First

- Add focused regressions for any behavior-bearing cleanup.
- For pure typing cleanup, run focused ESLint and existing tests for the touched
  package or surface before updating baselines.

## Validation Plan

- Probe candidate files with `npm run code-dojo:eslint:offenders`.
- Run focused raw ESLint on touched files.
- Run `npm run code-dojo:changed`.
- Run focused behavior tests for touched surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `git diff --check`.

## Acceptance Criteria

- The selected touched files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `414` or lower.
- The ESLint baseline records the lower live count.
- The Code Dojo exception ledger and `package.json` report the lower ceiling.
- The next ratchet target is documented as `364` or lower.
