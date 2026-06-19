# WF-157 Respecting the Dojo Ratchet To 520

## Status

Implemented.

## Tracker

- GitHub Issue: [#427](https://github.com/flyingrobots/bijou/issues/427)
- Pull Request: [#428](https://github.com/flyingrobots/bijou/pull/428)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Bijou earns the next Code Dojo checkpoint by removing at least 50 counted
standards violations from the landed `main` ceiling without losing the
Respectful Repo: Enter the Code Dojo direction.

## Current Truth

Live counts on `main` at `b6ea3474`:

- aggregate Code Dojo debt: `570`
- ESLint findings: `162`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `520` or lower

Top current ESLint offender clusters:

- `packages/bijou-i18n/src/runtime.ts`: `9`
- `scripts/pr-review-status.ts`: `4`
- `examples/_stories/protocol.ts`: `3`
- `packages/bijou-i18n-tools-node/src/filesystem.ts`: `3`
- `packages/bijou-i18n/src/localization.ts`: `3`
- `packages/bijou-mcp/src/tools/docs.ts`: `3`
- `packages/bijou-tui/src/keybindings.test.ts`: `3`
- `packages/bijou-tui/src/overlay-drawer.test.ts`: `3`
- `packages/bijou-tui/src/runtime.test-support.ts`: `3`
- `packages/bijou-tui/src/subapp/mount.ts`: `3`
- `packages/bijou/src/core/binding-frame-update.test.ts`: `3`
- `tests/cycles/DF-069/dogfood-block-registry.test.ts`: `3`

The DOGFOOD app entrypoint remains oversized after the WF-156 merge:

- `examples/docs/app.ts`: `3,306` physical lines / `114,890` bytes
- DOGFOOD raw-string debt: `2,373`

## Implementation Notes

WF-157 removes `52` live type-aware ESLint findings, lowering the ESLint
baseline from `162` to `110` and the aggregate Code Dojo ceiling from `570` to
`518`.

Cleanup clusters:

- i18n runtime-adjacent boundaries: story protocol index guards, catalog
  filesystem parsing, authoring-tool record handling, and localized value
  clone/freeze validation.
- MCP docs examples: replace docs-only renderer assertions with local JSON-shape
  coercion helpers for guided flow, preference list, and stats panel examples.
- TUI/core tests and helpers: keybinding/action visibility checks, drawer
  invalid-input coverage, runtime support typing, subapp command mapping,
  binding-frame invalid input coverage, DOGFOOD block registry invalid-input
  and immutability checks, flex/pager numeric formatting, navigable-table
  repeat loops, notification row guards, motion reconciliation narrowing, and
  split-pane grapheme guards.
- Examples: mark top-level app launches as intentionally floated with `void`.

Per the operator's temporary waiver for touched-file size ratchets, existing
file/context entries for touched legacy-large files were refreshed to their
current measured line/byte counts. No new counted file/context, mock-ban, or
code-size entries were added.

## Scope

- Select focused cleanup clusters from current ESLint or Code Dojo offenders.
- Prefer real type, data-shape, deterministic-test, and control-flow fixes over
  suppressions or cosmetic baseline churn.
- Continue shrinking oversized files when that contributes to the same standards
  objective.
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

1. Is aggregate Code Dojo debt at `520` or lower?
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
   a slice that can remove at least `50` findings.
2. Write focused regressions only where cleanup exposes a behavior or module
   boundary risk.
3. Replace unsafe assertions, non-null assertions, implicit coercions,
   nondeterministic clocks, fake async shapes, and oversized local modules with
   typed helpers and explicit control flow.
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
- Aggregate Code Dojo debt is `520` or lower.
- The ESLint baseline records the lower live count.
- The Code Dojo exception ledger and `package.json` report the lower ceiling.
- The next ratchet target is documented as `468` or lower.
