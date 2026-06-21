# WF-162 Respecting the Dojo Ratchet 162

## Decision Summary

Cut `100` counted Code Dojo debt items from the merged `262` baseline and land
the next Respecting the Dojo checkpoint at `162` aggregate violations or lower.

## Hill

WF-161 exhausted most of the low-risk oversized test/spec split pool. The repo
still carries structural debt in file/context and code-size ledgers, so this
cycle has to combine remaining deterministic test decomposition with production,
tooling, and example module extraction.

The goal is not cosmetic movement. The resulting ledgers must describe less
debt because large files were split into smaller, coherent modules without
weakening public behavior, tests, or standards.

## Current Truth

- Aggregate Code Dojo debt: `262`
- File/context baseline: `217`
- Mock-ban baseline: `0`
- Code-size baseline: `45`, including `3` hard-limit files
- ESLint baseline: `0`
- Required target for this cycle: `162` aggregate violations or lower
- Tracker issue: #439

## Scope

- Split the remaining over-threshold deterministic test/spec files that are
  safe to decompose.
- Extract enough production, tooling, and example modules to remove the
  remaining counted debt needed for a `100` item aggregate reduction.
- Keep original module entrypoints as compatibility facades when public import
  paths are part of the package surface.
- Refresh Code Dojo file/context and code-size ledgers from live files.
- Lower `package.json` `code-dojo:debt --max` to the measured live count.
- Update `docs/code-dojo-exceptions.md` and `docs/CHANGELOG.md`.

## Non-Goals

- No product feature work.
- No release-version work.
- No behavior/API breakage.
- No rebase, amend, force push, or draft PR.
- No large-file marker escape hatches and no standards carveout expansion.

## Implementation Strategy

1. **Finish the deterministic test split pool.**
   - Split the remaining over-threshold test/spec files into focused
     threshold-sized specs.
   - Preserve all assertions and snapshots.
   - Prefer semantic describe-group boundaries over arbitrary line cuts.
2. **Extract high-yield code-size modules.**
   - Target modules where one extraction removes both a file/context entry and
     a code-size entry.
   - Keep stable public files as facades that re-export or delegate to focused
     internals.
   - Avoid broad rewrites inside domain logic unless tests pin the behavior.
3. **Extract file/context-only modules when needed.**
   - Target self-contained data, fixtures, option tables, test support helpers,
     parser/render helper clusters, and CLI workflow helpers.
   - Keep each new file below `150` lines and `12,000` bytes.
4. **Ratcheting and proof.**
   - Regenerate the file/context baseline from live files.
   - Remove code-size entries only when live files are below the ratchet limit
     or have been replaced by smaller modules.
   - Lower the aggregate debt ceiling to `162` or lower.

## Implementation Outcome

The cycle lands exactly at `162` aggregate Code Dojo violations:

- File/context baseline: `136`
- Mock-ban baseline: `0`
- Code-size baseline: `26`, including `3` hard-limit files
- ESLint baseline: `0`

The reduction combines:

- Remaining deterministic test and test-support splits, including app-frame,
  runtime-interactive, textarea, PTY-driver, DOGFOOD light-theme, docs-preview,
  and test adapter support files.
- Declaration-boundary module extraction for standard-blocks, theme helpers,
  packed-cell, component metadata, TUI navigation/layout helpers, transition
  shaders, block metadata, schema blocks, selection, binding lifecycle, DAG
  pane, focus area, raster glyphs, layout envelopes, overlays, GraphQL blocks,
  viewport, binding, and notifications.
- Compatibility facades at the original import paths so public consumers keep
  stable module entrypoints while implementations move into smaller part files.

## Candidate Set

The starting debt pool is:

- `43` remaining test-ish file/context entries, including `3` code-size entries.
- `174` production/tooling/example file/context entries.
- `45` code-size entries total.

Expected reduction mix:

- About `43` file/context entries from the remaining deterministic test/spec
  split pool.
- At least `57` additional aggregate entries from production, tooling, example,
  or support-module extractions.

The exact final candidate set can adjust during implementation if a file proves
unsafe to split mechanically, but the live aggregate target must stay at `162`
or lower.

## Tests And Validation

- Focused Vitest run for generated split specs and touched module facades.
- `npm run code-dojo:changed`
- `npm run code-dojo:verify`
- `npm run typecheck:test`
- `npm run lint`
- `npm run docs:inventory`
- `git diff --check`
- Full pre-push verification before final PR handoff.

## Acceptance Criteria

- Aggregate Code Dojo debt is `162` or lower.
- File/context baseline and code-size baseline match measured live repository
  state.
- Mock-ban and ESLint baselines remain `0`.
- No generated file exceeds `150` lines or `12,000` bytes unless it remains in
  the shrinking ledger.
- Public imports continue to work through stable facades.
- Full local and GitHub validation gates pass.

## Playback Questions

1. Did the aggregate debt fall by at least `100`?
2. Did every split preserve original assertions and public behavior?
3. Did all ledgers reflect measured live files rather than aspiration?
4. Did the cycle avoid adding new exceptions or widening old ones?
5. Did the PR stay non-draft and linked to issue #439?

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`
