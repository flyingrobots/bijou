# WF-155 Respecting the Dojo Ratchet To 624

## Status

In progress.

## Tracker

- GitHub Issue: [#423](https://github.com/flyingrobots/bijou/issues/423)
- Pull Request: [#424](https://github.com/flyingrobots/bijou/pull/424)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Bijou earns the next Code Dojo checkpoint by removing at least 50 counted
standards violations from the landed `main` ceiling without increasing any
other ratchet.

The current goalpost remains:

```text
Respectful Repo: Enter the Code Dojo
```

## Current Truth

Live counts on `main` at `5fa0aea9`:

- aggregate Code Dojo debt: `674`
- ESLint findings: `266`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `624` or lower

Implemented counts on this branch before review:

- aggregate Code Dojo debt: `623`
- ESLint findings: `215`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- next aggregate target: `573` or lower

Top current ESLint offender clusters:

- `examples/docs/storybook-app.ts`: `12`
- `packages/bijou-i18n/src/runtime.ts`: `9`
- `examples/docs/counter-block-demo.ts`: `6`
- `scripts/release-metadata.ts`: `6`
- `scripts/release-readiness.ts`: `6`
- `examples/docs/storybook-workstation.ts`: `5`
- `packages/bijou-tui/src/runtime-engine.ts`: `5`

Selected cleanup slice:

- `examples/docs/storybook-app.ts`
- `examples/docs/storybook-workstation.ts`
- `examples/docs/counter-block-demo.ts`
- `packages/bijou-i18n/src/localization.test.ts`
- `packages/bijou-tui-app/src/index.ts`
- `packages/bijou-tui-app/src/index.test.ts`
- `packages/bijou-tui/src/collection-surface.ts`
- `packages/bijou-tui/src/focus-area.test.ts`
- `packages/bijou/src/core/components/surface-primitives.test.ts`
- `examples/split-editors/main.ts`
- `packages/bijou-node/src/io.ts`

The DOGFOOD app entrypoint remains oversized after the previous split:

- `examples/docs/app.ts`: `4,165` physical lines / `147,799` bytes

This branch keeps cutting that file while preserving visible docs behavior:

- `examples/docs/app.ts`: `3,306` physical lines / `114,890` bytes
- extracted standard block docs, block preview surfaces, and Theme Inspector
  state into focused sub-150-line modules
- DOGFOOD raw-string debt: `2,373`, down from the `2,415` baseline

## Scope

- Select focused cleanup clusters from current ESLint or Code Dojo offenders.
- Prefer real type, data-shape, deterministic-test, and control-flow fixes over
  suppressions or cosmetic baseline churn.
- Continue shrinking DOGFOOD app file pressure when it contributes to the same
  standards objective.
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

1. Is aggregate Code Dojo debt at `624` or lower?
2. Did the implementation remove at least `50` real counted violations?
3. Did touched file/context, mock-ban, code-size, and DOGFOOD localization
   ceilings stay flat or lower?
4. Did focused tests for touched behavior pass?
5. Did any DOGFOOD app extraction preserve the visible docs behavior?

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
3. Replace unsafe assertions, non-null assertions, implicit coercions, fake
   async shapes, nondeterministic clocks, and overly large local modules with
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
- Run `npm run code-dojo:slice -- <touched TypeScript files>`.
- Run focused behavior tests for touched surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `git diff --check`.

## Acceptance Criteria

- The selected touched files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `623` or lower.
- The ESLint baseline records the lower live count.
- The Code Dojo exception ledger and `package.json` report the lower ceiling.
- The next ratchet target is documented as `573` or lower.
