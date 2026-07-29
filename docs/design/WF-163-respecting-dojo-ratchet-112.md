# WF-163 Respecting the Dojo Ratchet 112

## Decision Summary

Cut at least `50` counted Code Dojo debt items from the merged `162` baseline
and land the next Respecting the Dojo checkpoint at `112` aggregate violations
or lower.

This is the explicit quality prerequisite for the Profunctor Page inspection
target in issue #468.

## Hill

The remaining debt is structural. File/context and code-size ledgers identify
modules that exceed the repository's bounded-context rules. The cycle must
remove real entries by splitting coherent responsibilities while preserving
tests, exports, behavior, and deterministic output.

Ledger edits are evidence after implementation. They are not the
implementation.

## Current Truth

- Aggregate Code Dojo debt: `162`
- File/context baseline: `136`
- Mock-ban baseline: `0`
- Code-size baseline: `26`, including `3` hard-limit files
- ESLint baseline: `0`
- Required target: `112` aggregate violations or lower
- Tracker issue: #469
- Downstream issue: #468

## Scope

- Select the smallest safe set of remaining file/context and code-size
  offenders.
- Prefer modules where one coherent extraction removes both a file/context
  entry and a code-size entry.
- Preserve public entrypoints through compatibility facades when import paths
  are contractual.
- Split tests at semantic `describe` or fixture-family boundaries.
- Regenerate the file/context and code-size ledgers from measured files.
- Lower `package.json` `code-dojo:debt --max` to `112` or lower.
- Update the exception ledger, changelog, roadmap, and closeout evidence.

## Non-Goals

- No Profunctor Page adapter implementation.
- No public behavior or API redesign.
- No release publication.
- No new standards exception or large-file marker.
- No weakened threshold, skipped gate, or hand-edited aspirational count.

## Implementation Strategy

1. Inventory the remaining ledger entries through bounded repository
   projections.
2. Rank candidates by aggregate reduction, cohesion, and regression coverage.
3. Split deterministic tests and support modules at existing responsibility
   boundaries.
4. Extract production or tooling helpers only where public behavior is already
   pinned by focused tests.
5. Run focused tests after each candidate family.
6. Regenerate ledgers only after live files fall below their thresholds.
7. Run the full Code Dojo and repository gates before review.

## Tests And Validation

- Focused Vitest runs for every split test or module family.
- `npm run code-dojo:changed`
- `npm run code-dojo:verify`
- `npm run typecheck:test`
- `npm run lint`
- `npm run docs:inventory`
- `npm run test:run`
- `git diff --check`

## Acceptance Criteria

- Aggregate Code Dojo debt is `112` or lower.
- File/context and code-size ledgers match measured live files.
- Mock-ban and ESLint baselines remain `0`.
- No split loses assertions, exports, runtime behavior, or deterministic
  output.
- No new file exceeds `150` lines or `12,000` bytes unless it remains in the
  shrinking ledger.
- Full local and GitHub validation gates pass.
- Main at the resulting merge revision unblocks issue #468.

## Playback Questions

1. Did aggregate debt fall by at least `50`?
2. Does every removed ledger entry correspond to a measured file reduction?
3. Did each split preserve its prior tests and public entrypoints?
4. Did the cycle avoid new exceptions and unrelated product work?
5. Is issue #468 unblocked by merged evidence rather than a local claim?

## Linked Invariants

- TypeScript standards:
  `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`
- Tracker issue: #469
