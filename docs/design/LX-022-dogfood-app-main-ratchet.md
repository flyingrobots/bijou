# LX-022 DOGFOOD App Main Ratchet

## Status

Shaped.

## Tracker

- GitHub Issue: [#417](https://github.com/flyingrobots/bijou/issues/417)
- Pull Request: [#418](https://github.com/flyingrobots/bijou/pull/418)

## Legend

- Linked legend: LX, Localization and Bidirectionality
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

DOGFOOD must stop hiding its primary application surface inside one giant
module. This cycle starts breaking up `examples/docs/app.ts` while removing a
material Code Dojo slice from the same file.

## Current Truth

Live counts on `main` at `d1ecced7`:

- aggregate Code Dojo debt: `910`
- next aggregate Code Dojo target: `860` or lower
- ESLint findings: `502`
- `examples/docs/app.ts` ESLint findings: `118`
- `examples/docs/app.ts` file-context baseline: `5,794` lines and `203,093`
  bytes
- DOGFOOD raw-string debt: `2,656`
- `docs-app` raw-string debt: `258`
- missing Markdown localizations: `78`

Target for this cycle:

- remove at least `50` counted Code Dojo violations
- lower the aggregate Code Dojo baseline to `860` or lower
- shrink `examples/docs/app.ts` in both lines and bytes
- keep every new extracted file under normal file/context limits
- keep DOGFOOD raw-string debt flat or lower

## Scope

- Extract a coherent DOGFOOD app slice from `examples/docs/app.ts` into small
  modules.
- Clean the extracted path so it does not carry unsafe casts, `any`, or other
  current ESLint debt into the new files.
- Fix adjacent `examples/docs/app.ts` lint findings when they support the same
  decomposition.
- Ratchet `scripts/code-dojo/baselines/eslint.json`,
  `scripts/code-dojo/baselines/file-context.json`, `package.json`, and
  `docs/code-dojo-exceptions.md` only after measured lower counts prove the new
  values.
- Update `docs/CHANGELOG.md` with the landed counts.

## Non-Goals

- No full DOGFOOD app rewrite.
- No broad theme-lab, landing-page, or navigation redesign.
- No placeholder localization rows.
- No Code Dojo baseline increases.
- No release-version scope.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Did aggregate Code Dojo debt fall to `860` or lower?
2. Did `examples/docs/app.ts` shrink in both lines and bytes?
3. Did every new extracted module stay below `150` lines and `12,000` bytes?
4. Did DOGFOOD raw-string debt stay flat or lower?
5. Did the touched DOGFOOD surface still pass focused smoke or preview tests?

## User Experience Contract

The DOGFOOD app must render the same visible product behavior after the split.
Navigation rows, guide rows, landing behavior, theme selection, and preview
panes must preserve their current semantics unless this design explicitly says
otherwise.

## Localization And Directionality Posture

Any visible string converted during this slice must use the existing DOGFOOD
localization port and catalog workflow. Moving raw strings to a new module is
not a debt reduction unless the raw-string inventory proves the total count
went down.

## Agent Inspectability And Explainability Posture

The split should create named modules that reveal responsibility from their
file names. Reviewers should be able to tell which code owns app row rendering,
standard block preview data, or other extracted behavior without scrolling
through the full DOGFOOD app file.

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- file/context baseline: `scripts/code-dojo/baselines/file-context.json`
- ESLint baseline: `scripts/code-dojo/baselines/eslint.json`
- DOGFOOD i18n debt baseline: `examples/docs/i18n-debt.ts`

## Implementation Outline

1. Extract the app row formatter path from `examples/docs/app.ts` and remove
   unsafe token casts.
2. Extract one additional coherent app slice if needed to meet the 50-violation
   goalpost without creating over-limit files.
3. Run focused ESLint and `npm run code-dojo:changed` on the touched slice.
4. Run DOGFOOD i18n debt checks to prove raw strings were not shifted.
5. Ratchet baselines and update the exception ledger after live counts prove
   lower values.

## Tests To Write First

- The regression proof for the row-format path is the current ESLint failure
  cluster in `examples/docs/app.ts`; after extraction those findings must be
  absent from focused ESLint.
- Add behavioral tests only if the extraction changes a runtime boundary.

## Validation Plan

- `npx eslint examples/docs/app.ts <new extracted files>`
- `npm run code-dojo:changed`
- `npm run dogfood:i18n:debt`
- focused DOGFOOD smoke or preview tests for touched surfaces
- `npm run code-dojo:debt`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`

## Acceptance Criteria

- Aggregate Code Dojo debt is `860` or lower.
- `examples/docs/app.ts` has fewer than `5,794` lines and fewer than `203,093`
  bytes.
- New extracted files are below normal file/context limits.
- `docs-app` raw-string debt is `258` or lower.
- Missing Markdown localization debt remains `78` or lower.
- Issue #417 and the pull request are cross-linked.
