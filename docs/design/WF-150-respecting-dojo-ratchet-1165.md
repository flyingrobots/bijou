# WF-150 Respecting the Dojo Ratchet To 1165

## Status

Implemented.

## Tracker

- Issue: [#405](https://github.com/flyingrobots/bijou/issues/405)
- Pull request: [#406](https://github.com/flyingrobots/bijou/pull/406)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Respectful Repo: Enter the Code Dojo remains the active goalpost before the
next `v7.2.0` product pull. WF-149 landed at `321bb2b0` with aggregate Code
Dojo debt at `1,215`.

The current goalpost is not a release version. It is:

```text
Respectful Repo: Enter the Code Dojo
```

## Current Truth

Live counts on `main` at `321bb2b0`:

- aggregate Code Dojo debt: `1,215`
- ESLint findings: `807`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,165` or lower

Selected cleanup slice:

- `packages/bijou-tui/src/app-frame-input-overlays.test.ts`
- `packages/bijou-tui/src/subapp/mount.test.ts`
- `packages/bijou/src/core/block-metadata.test.ts`
- `scripts/docs-preview-landing.test.ts`
- `scripts/smoke-all-examples.test.ts`
- `tests/cycles/DL-017/dogfood-light-theme-readiness.test.ts`
- `tests/cycles/LX-011/dogfood-locale-ratchet.test.ts`

Implemented counts on this branch before review:

- aggregate Code Dojo debt: `1,160`
- ESLint findings: `752`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,110` or lower

## Scope

- Select a focused cleanup slice from current ESLint or Code Dojo offenders.
- Remove at least `50` counted violations with real fixes.
- Prefer real type, data-shape, and control-flow fixes over suppressions or
  cosmetic baseline churn.
- Keep touched file/context, mock-ban, code-size, and DOGFOOD localization
  ratchets flat or lower.
- Ratchet stale baseline entries down or out when touched files fall below
  thresholds.
- Update the Code Dojo exception ledger, ESLint baseline, package ceiling, and
  changelog with the landed count.

## Non-Goals

- Do not raise baselines.
- Do not change public runtime semantics merely to satisfy lint.
- Do not return to `v7.2.0` product work in this cycle.
- Do not treat exceptions as adherence.

## Playback Questions

1. Is aggregate Code Dojo debt at `1,165` or lower?
2. Did the implementation remove at least `50` real counted violations?
3. Did touched file/context, mock-ban, code-size, and DOGFOOD localization
   ceilings stay flat or lower?
4. Did focused tests for touched behavior pass?

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
3. Replace unsafe assertions, non-null assertions, implicit coercions, and fake
   async shapes with typed helpers and explicit control flow.
4. Ratchet the ESLint baseline and aggregate Code Dojo ceiling after the live
   count is proven lower.
5. Update docs and changelog with final counts and the next target.

## Tests To Write First

- Add focused regressions for any behavior-bearing cleanup.
- For pure typing cleanup, run focused ESLint and existing tests for the touched
  package or surface before updating baselines.

## Validation Plan

- `npm run code-dojo:slice -- <touched files>`
- focused tests covering touched behavior
- `npm run code-dojo:debt`
- `npm run code-dojo:verify`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`
- full pre-push gate before merge

## Acceptance Criteria

- Aggregate debt is `1,165` or lower.
- ESLint baseline is lowered by at least `50` unless other real Dojo debt is
  removed in the same cycle.
- No file/context, mock-ban, or code-size baseline increases are introduced.
- GitHub PR checks are green with zero unresolved review threads before merge.
