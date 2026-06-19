# LX-021 DOGFOOD String Debt Ratchet

## Status

Implemented.

## Tracker

- GitHub Issue: [#415](https://github.com/flyingrobots/bijou/issues/415)
- Pull Request: [#416](https://github.com/flyingrobots/bijou/pull/416)

## Legend

- Linked legend: LX, Localization and Bidirectionality
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

DOGFOOD must stop treating raw visible strings as harmless residue. This cycle
removes a material slice from the raw-string baseline by moving selected
component story copy behind the existing DOGFOOD localization catalog workflow.

## Current Truth

Live counts on `main` at `aab792ed`:

- DOGFOOD raw-string debt: `2,761`
- `component-stories` raw-string debt: `1,631`
- `dogfood-blocks` raw-string debt: `681`
- `docs-app` raw-string debt: `258`
- missing Markdown localizations: `78`
- aggregate Code Dojo debt: `951`

Target for this cycle:

- remove at least `100` DOGFOOD raw-string findings
- lower the total raw-string baseline to `2,661` or lower
- lower `component-stories` to `1,531` or lower
- keep missing Markdown localizations flat at `78`
- keep aggregate Code Dojo debt at `951` or lower

Implemented counts on this branch before review:

- DOGFOOD raw-string debt: `2,656`
- `component-stories` raw-string debt: `1,526`
- missing Markdown localizations: `78`
- aggregate Code Dojo debt: `910`
- ESLint findings: `502`
- next aggregate Code Dojo target: `860` or lower

## Scope

- Convert a coherent high-density slice from `examples/docs/stories.ts`.
- Add source rows and current `en`, `de`, `es`, and `fr` values in
  `examples/docs/i18n/source/dogfood-strings.csv`.
- Regenerate `examples/docs/i18n/catalogs/*/bijou.dogfood.json`.
- Ratchet `examples/docs/i18n-debt.ts` to the proven lower total and
  `component-stories` count.
- Update `docs/CHANGELOG.md` with the landed counts and next string-debt
  target.

## Non-Goals

- No full DOGFOOD localization claim.
- No Markdown corpus translation in this cycle.
- No catalog placeholder rows that satisfy the gate while preserving accidental
  English for non-English locales.
- No Code Dojo baseline increases.
- No release-version scope.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Did DOGFOOD raw-string debt fall by at least `100`?
2. Did every changed catalog key have current rows for all supported locales?
3. Did `component-stories` own the raw-string reduction instead of shifting
   debt to another surface?
4. Did missing Markdown localization debt stay flat?
5. Did Code Dojo aggregate debt stay at `951` or lower?

## User Experience Contract

Converted story copy must still read as the same DOGFOOD demonstration. The
localized text may use conservative translations, but it must not replace
visible content with placeholder keys or intentionally untranslated fallback
rows.

## Localization And Directionality Posture

This cycle uses the existing DOGFOOD localization port. It does not introduce a
new directionality model. Any converted copy should continue to flow through
`dogfoodLocalizedText` so locale selection, fallback interpolation, and catalog
checks remain centralized.

## Agent Inspectability And Explainability Posture

The PR must make the changed keys easy to audit:

- catalog IDs should be grouped by the story surface they serve
- fallback copy should remain adjacent to the rendered usage
- final debt counts should be recorded in this design doc or the PR summary

## Linked Invariants

- DOGFOOD i18n source catalog: `examples/docs/i18n/source/dogfood-strings.csv`
- DOGFOOD i18n debt baseline: `examples/docs/i18n-debt.ts`
- DOGFOOD i18n build: `scripts/dogfood-i18n-build.ts`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`

## Implementation Outline

1. Add localization access to the selected component story rendering helpers.
2. Convert the selected raw literals to `dogfoodLocalizedText` calls with stable
   `stories.*` catalog IDs.
3. Add current rows for every new or changed key in the source CSV.
4. Regenerate runtime catalogs.
5. Run the DOGFOOD i18n gates, focused story tests, and Code Dojo debt checks.
6. Ratchet the i18n debt baseline only after the live inventory proves the
   lower count.

## Tests To Write First

- Add focused tests only if the conversion changes a behavior boundary or
  story state shape.
- For copy-only localization movement, the failing proof is the current
  `npm run dogfood:i18n:debt` inventory against the lower target before the
  implementation lands.

## Validation Plan

- `npm run dogfood:i18n:complete`
- `npm run dogfood:i18n:check`
- `npm run dogfood:i18n:debt`
- `npm run code-dojo:slice -- examples/docs/stories.ts`
- focused tests for DOGFOOD/storybook rendering if touched paths expose one
- `npm run code-dojo:debt`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`

## Acceptance Criteria

- DOGFOOD raw-string debt is `2,661` or lower.
- `component-stories` raw-string debt is `1,531` or lower.
- Missing Markdown localization debt remains `78` or lower.
- Code Dojo aggregate debt remains `951` or lower.
- Runtime catalogs are regenerated from the source CSV.
- Issue #415 and the pull request are cross-linked.
