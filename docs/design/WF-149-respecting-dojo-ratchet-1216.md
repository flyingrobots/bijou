# WF-149 Respecting the Dojo Ratchet To 1216

## Status

Shaping.

## Tracker

- GitHub Issue: [#403](https://github.com/flyingrobots/bijou/issues/403)
- Pull Request: pending

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Bijou keeps earning its place inside the Code Dojo by removing at least 50
counted standards violations from the landed `main` ceiling without increasing
any other ratchet.

The current goalpost is not a release version. It is:

```text
Respectful Repo: Enter the Code Dojo
```

## Current Truth

Live counts on `main` at `ae6c34b6`:

- aggregate Code Dojo debt: `1,266`
- ESLint findings: `857`
- file/context baseline: `332`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,216` or lower

## Scope

- Select a focused cleanup slice from current ESLint or Code Dojo offenders.
- Prefer real type, data-shape, and control-flow fixes over suppressions or
  cosmetic baseline churn.
- Keep touched file/context, mock-ban, code-size, and DOGFOOD localization
  ratchets flat or lower.
- Update `scripts/code-dojo/baselines/eslint.json`, `package.json`,
  `docs/code-dojo-exceptions.md`, and `docs/CHANGELOG.md` after the live count
  is proven lower.

## Non-Goals

- No baseline increases.
- No release-version scope.
- No broad feature work.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Is aggregate Code Dojo debt at `1,216` or lower?
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

- Probe candidate files with `npm run code-dojo:eslint:offenders`.
- Run focused raw ESLint on touched files.
- Run `npm run code-dojo:slice -- <touched TypeScript files>`.
- Run focused behavior tests for touched surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `git diff --check`.

## Acceptance Criteria

- The selected touched files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `1,216` or lower.
- The ESLint baseline records the lower live count.
- The Code Dojo exception ledger and `package.json` report the lower ceiling.
- The next ratchet target is documented as `1,166` or lower.
