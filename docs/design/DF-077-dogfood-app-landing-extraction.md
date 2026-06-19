# DF-077: DOGFOOD App Landing Extraction

## Status

Implemented.

## Tracker

- Issue: [#421](https://github.com/flyingrobots/bijou/issues/421)
- Pull request: [#422](https://github.com/flyingrobots/bijou/pull/422)
- Branch: `cycle/dogfood-app-landing-extraction-725`

## Current Truth

Live counts on `main` at `2fcdba1a`:

- aggregate Code Dojo debt: `674`
- next aggregate Code Dojo target: `624` or lower
- ESLint findings: `266`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` hard-limit files
- `examples/docs/app.ts`: `5,792` physical lines and `201,982` bytes
- `examples/docs/app.ts` file/context baseline: `5,793` lines and `201,982` bytes
- `examples/docs/app.ts` code-size baseline: `5,793` lines
- DOGFOOD raw-string debt: `2,644`
- `docs-app` raw-string debt: `256`
- missing Markdown localization debt: `78`

Implemented counts on this branch before review:

- aggregate Code Dojo debt: `725`
- next aggregate Code Dojo target: `675` or lower
- ESLint findings: `317`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` hard-limit files
- `examples/docs/app.ts`: `4,165` enforced lines and `147,799` bytes
- `examples/docs/app.ts` file/context baseline: `4,166` split-counted lines and `147,799` bytes
- `examples/docs/app.ts` code-size baseline: `4,165` lines
- DOGFOOD raw-string debt: `2,415`
- `docs-app` raw-string debt: `185`
- missing Markdown localization debt: `78`

`examples/docs/app.ts` is now ESLint-clean and no longer owns the landing or
theme-token subsystems, but it remains both a file/context exception and a hard
code-size exception. The next respectful step is still structural: move coherent
docs explorer subsystems out until the main DOGFOOD app file stops being a
review and iteration bottleneck.

## Problem

The DOGFOOD app main file mixes content catalog setup, landing animation and
theme rendering, framed docs explorer state, pane layout, mouse routing, and
application lifecycle wiring. That makes behavior changes expensive even when
lint is clean because reviewers and agents must reason across thousands of
unrelated lines.

The landing surface is the best first extraction target: it owns a large set of
theme tokens, glyph rendering, animated background, quality controls, caches,
and overlays while depending on only a small part of the root model. Pulling it
behind a typed module boundary reduces the monolith without changing the
visible DOGFOOD route.

## Scope

- Extract the landing surface/theme/rendering subsystem from
  `examples/docs/app.ts` into focused module(s) under `examples/docs/`.
- Preserve existing landing route behavior, theme choices, quality controls,
  prompt rendering, performance HUD, and DOGFOOD panel output.
- Keep the extracted module typed through explicit interfaces instead of
  importing the whole root model shape.
- Tighten `examples/docs/app.ts` file/context and code-size baselines after the
  extraction.
- Keep all touched DOGFOOD i18n debt flat or lower. Any user-facing landing
  copy touched by this cycle must remain catalog-backed or reduce counted raw
  strings.
- Update the changelog and Code Dojo exception ledger with landed counts.

## Out Of Scope

- Redesigning the landing page visuals.
- Changing runtime navigation, input bindings, or shell theme semantics.
- Moving the docs explorer panes in this slice.
- Expanding the localization catalog beyond strings directly needed by the
  extraction.
- Adding new Code Dojo exceptions.

## Implementation Notes

The first implementation pass should move the following clusters together:

- landing theme seed/token types and constants
- landing quality profile types and constants
- landing renderer creation and surface preparation
- background, wake, SVG, prompt, FPS badge, and DOGFOOD panel helpers
- landing theme conversion and color utility helpers only when they are landing
  specific
- docs shell theme flattening/state helpers
- theme token palette, model, and diagnostics helpers

Shared helpers that still serve docs panes moved behind small shared theme
modules only where the boundary stayed narrow and typed.

## Validation Plan

- `npx eslint examples/docs/app.ts examples/docs/app-landing*.ts examples/docs/app-docs-*.ts examples/docs/app-theme-*.ts examples/docs/i18n-debt.ts`
- `npm run code-dojo:changed`
- `npm run code-dojo:debt`
- `npm run dogfood:i18n:debt`
- `npm run test:run -- tests/cycles/DF-060/v7-dogfood-release-title-screen.test.ts tests/cycles/DF-067/responsive-dogfood-layout-variants.test.ts scripts/smoke-dogfood.test.ts tests/cycles/WF-003/replace-smoke-examples-with-smoke-dogfood.test.ts`
- `npm run smoke:dogfood:landing -- --skip-build`
- `npm run smoke:dogfood:docs -- --skip-build`
- `npm run code-dojo:verify`
- `npm run lint`
- `npm run docs:inventory`
- `git diff --check`
- full pre-push gate

Implemented validation:

- `npx eslint examples/docs/app.ts examples/docs/app-docs-shell-theme.ts
  examples/docs/app-docs-theme-tokens.ts examples/docs/app-theme-diagnostics.ts
  examples/docs/app-theme-token-model.ts examples/docs/app-theme-token-palette.ts
  examples/docs/i18n-debt.ts examples/docs/i18n/dogfood-catalog.ts
  examples/docs/locale.ts examples/docs/node-locale.ts examples/docs/svg-raster.ts
  packages/bijou/src/core/ansi-lint.test.ts
  packages/bijou/src/core/app-shell-composition.ts
  packages/bijou/src/core/components/dag-stats.ts
  packages/bijou/src/core/components/progress.ts
  packages/bijou/src/core/render/packed-cell.ts
  packages/bijou/src/core/theme/doctor.ts scripts/dogfood-i18n-export.ts
  tests/cycles/DL-004/drawer-rhythm-and-notice-rows.test.ts`
- `npm run typecheck:test`
- `npm run dogfood:i18n:complete`
- `npm run dogfood:i18n:check`
- `npm run dogfood:i18n:debt`
- `npm run code-dojo:changed`
- `npm run code-dojo:debt`
- `npm run code-dojo:verify`
- `npm run test:run -- packages/bijou/src/core/ansi-lint.test.ts
  tests/cycles/DL-004/drawer-rhythm-and-notice-rows.test.ts`
- `npm run test:run -- scripts/svg-raster.test.ts
  packages/bijou/src/core/theme/doctor.test.ts
  packages/bijou/src/core/components/dag-stats.test.ts
  packages/bijou/src/core/components/progress.test.ts
  packages/bijou/src/core/app-shell-composition.test.ts
  packages/bijou/src/core/render/packed-cell.test.ts
  scripts/docs-preview-landing.test.ts
  tests/cycles/DF-001/dogfood-coverage-progress.test.ts
  tests/cycles/DL-017/dogfood-light-theme-readiness.test.ts
  tests/cycles/DL-018/first-party-theme-variant-coverage.test.ts`
- `npm run test:run -- tests/cycles/DF-060/v7-dogfood-release-title-screen.test.ts
  tests/cycles/DF-067/responsive-dogfood-layout-variants.test.ts
  scripts/smoke-dogfood.test.ts
  tests/cycles/WF-003/replace-smoke-examples-with-smoke-dogfood.test.ts`
- `npm run smoke:dogfood:landing -- --skip-build`
- `npm run smoke:dogfood:docs -- --skip-build`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`

## Acceptance Criteria

- `examples/docs/app.ts` is materially smaller and no longer owns the landing
  rendering subsystem.
- The extracted landing module stays under the 500-line code-size ratchet if
  feasible; if not feasible, the split must still lower the total hard-limit
  pressure on `app.ts` and document the next split.
- `examples/docs/app.ts` file/context and code-size baselines are tightened.
- DOGFOOD i18n raw-string debt is flat or lower, with touched-file ratchets
  green.
- Issue #421, this design doc, and the pull request are cross-linked.
