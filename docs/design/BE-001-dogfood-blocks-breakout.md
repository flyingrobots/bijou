# BE-001 Project Big Extraction: DOGFOOD Blocks Breakout

## Status

Implemented.

## Tracker

- GitHub Issue: [#435](https://github.com/flyingrobots/bijou/issues/435)
- Pull Request: [#436](https://github.com/flyingrobots/bijou/pull/436)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Project Big Extraction starts by killing a hard-limit monolith instead of
preserving legacy-large files as permanent habitat.

`examples/docs/dogfood-blocks.ts` is currently a `2,637` line / `92,020` byte
DOGFOOD block registry monolith with `151` exports. The cycle turns it into a
small compatibility facade backed by focused modules, preserving existing
consumers while removing the hard-limit file from the active monolith list.

## Current Truth

Live counts on `main` at `b058b2c5`:

- aggregate Code Dojo debt: `364`
- file/context baseline: `309`
- mock-ban baseline: `0`
- code-size baseline: `55`, including `4` hard-limit files
- ESLint baseline: `0`
- next aggregate target: `314` or lower

Current hard-limit files:

- `examples/docs/stories.ts`: `4,558` lines / `169,954` bytes
- `examples/docs/app.ts`: `3,306` lines / `114,972` bytes
- `packages/bijou-tui/src/app-frame.ts`: `2,847` lines / `109,042` bytes
- `examples/docs/dogfood-blocks.ts`: `2,637` lines / `92,020` bytes

`dogfood-blocks.ts` has low external fanout compared to the other hard-limit
files, but high export surface. That makes it a good first Big Extraction
target: keep `./dogfood-blocks.js` as the public facade, move cohesive internals
behind it, and avoid broad consumer churn.

## Implementation Result

BE-001 turns `examples/docs/dogfood-blocks.ts` into a `97` line / `3,740` byte
facade and moves the registry, schema parsing, renderers, block definitions,
and registry entries into focused modules. The largest extracted module is
`examples/docs/dogfood-block-docs-surface-render.ts` at `143` lines /
`5,597` bytes, so every new module stays below the Code Dojo file/context
threshold.

Live debt after the extraction:

- aggregate Code Dojo debt: `362`
- file/context baseline: `308`
- mock-ban baseline: `0`
- code-size baseline: `54`, including `3` hard-limit files
- ESLint baseline: `0`
- DOGFOOD raw-string debt: `2,365`, down from the stored `2,415` baseline
- next aggregate target from the live count: `312` or lower

The extraction removes `dogfood-blocks.ts` from both debt ledgers but only
removes two aggregate violations. It is an honest structural reduction, not a
50-violation goalpost by itself.

The DOGFOOD raw-string baseline is also transferred from the old
`dogfood-blocks` surface to the extracted module surfaces at exact measured
counts, while stale slack in the docs, counter, and Storybook surfaces is
removed.

## Scope

- Split DOGFOOD block registry, block definitions, renderers, schema helpers,
  and registry assembly out of `examples/docs/dogfood-blocks.ts`.
- Preserve the current public import path and named exports through the facade.
- Keep every new module below Code Dojo file/context and code-size thresholds.
- Do not add new file/context or code-size baseline entries.
- Update the Code Dojo ledgers after live counts prove the monolith is gone.
- Update changelog and exception documentation with the Big Extraction result.

## Non-Goals

- No redesign of DOGFOOD blocks or rendered content.
- No broad rewrite of `examples/docs/app.ts`.
- No extraction of `stories.ts` or `app-frame.ts` in this cycle.
- No release-version work.
- No rebase, amend, force push, or draft PR.

## Extraction Map

Target module boundaries:

- `examples/docs/dogfood-block-registry.ts`
  - `DogfoodBlockRegistry`
  - registry entry brands and guards
  - `dogfoodBlockRegistryEntry`
  - `dogfoodBlockRegistry`
  - coverage report helpers

- `examples/docs/dogfood-block-docs-surface.ts`
  - docs surface requirements, intents, and view data
  - `dogfoodDocsSurfaceBlock`
  - docs surface schema adapter/block
  - docs surface preview output

- `examples/docs/dogfood-block-preview.ts`
  - block preview requirements, intents, and view data
  - `blockPreviewBlock`
  - block preview renderer

- `examples/docs/dogfood-block-guide-inspector.ts`
  - guide inspector requirements, intents, and view data
  - `guideInspectorBlock`
  - guide inspector renderer

- `examples/docs/dogfood-block-shell.ts`
  - settings menu block
  - search panel block
  - notification center block
  - perf HUD block
  - help overlay block
  - command palette block
  - footer hint block

- `examples/docs/dogfood-block-doc-navigation.ts`
  - title screen block
  - navigation list block
  - documentation article block

- `examples/docs/dogfood-block-workbench.ts`
  - BlockLab/Storybook workbench block
  - shared workbench aliases and registry entries

- `examples/docs/dogfood-block-schema-utils.ts`
  - schema parsing helpers
  - plain-record/data property helpers
  - schema error helpers
  - text/number/boolean normalization helpers

- `examples/docs/dogfood-blocks.ts`
  - compatibility facade
  - public re-exports
  - `requiredDogfoodBlockSurfaceIds`
  - `defaultDogfoodBlockRegistry`

## Implementation Outline

1. Add focused safety tests for facade compatibility and registry assembly if
   existing tests do not pin the split boundary.
2. Extract schema utility helpers first because docs-surface parsing depends on
   them and they have no app-facing behavior.
3. Extract the registry class and entry helpers while preserving exported names.
4. Extract block families in cohesive groups: docs surface, preview/inspector,
   shell overlays, docs navigation, and workbench.
5. Reduce `dogfood-blocks.ts` to a facade plus registry assembly.
6. Recompute Code Dojo file/context and code-size ledgers and lower counts.
7. Update docs/code-dojo-exceptions, changelog, and this design doc with
   implementation notes and validation evidence.

## Tests To Write First

- Facade export compatibility test:
  - importing from `examples/docs/dogfood-blocks.js` exposes the expected
    default registry, required surface ids, and representative block exports.

- Registry assembly test:
  - `defaultDogfoodBlockRegistry` includes every `requiredDogfoodBlockSurfaceId`
    after extraction.

Existing focused suites remain the behavioral net:

- `tests/cycles/DF-030/dogfood-docs-surface-block.test.ts`
- `tests/cycles/DF-069/dogfood-block-registry.test.ts`
- `tests/cycles/DF-070/dogfood-block-product-polish.test.ts`
- `tests/cycles/DF-071/dogfood-block-authored-surfaces.test.ts`
- `tests/cycles/DX-046/graphql-dogfood-navigation-fixture.test.ts`

## Validation Plan

- Focused Vitest suites listed above
- `npm run code-dojo:changed`
- `npm run dogfood:i18n:complete`
- `npm run dogfood:i18n:check`
- `npm run dogfood:i18n:debt`
- `npm run typecheck:test`
- `npm run lint`
- `npm run code-dojo:verify`
- `npm run docs:inventory`
- `git diff --check`

## Acceptance Criteria

- `examples/docs/dogfood-blocks.ts` is below Code Dojo file/context and
  code-size thresholds.
- No extracted module exceeds Code Dojo file/context or code-size thresholds.
- The hard-limit code-size count drops from `4` to `3`.
- Aggregate Code Dojo debt drops or stays flat without new baseline entries.
- Existing public imports from `./dogfood-blocks.js` continue to work.
- Focused DOGFOOD block tests and local dojo/type/lint gates pass.

## Playback Questions

1. Is `dogfood-blocks.ts` no longer a hard-limit file?
2. Did the facade preserve the public export surface used by consumers?
3. Did the split avoid adding new Code Dojo baseline entries?
4. Are all new modules below file/context and code-size thresholds?
5. Did the DOGFOOD block behavior tests pass?

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`
