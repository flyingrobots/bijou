# WF-165 Respecting the Dojo Ratchet 12

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor Human

James Ross.

## Sponsor Agent

Codex.

## Decision Summary

Complete issue
[#480](https://github.com/flyingrobots/bijou/issues/480) by removing all `25`
files that are counted in both the file/context and code-size ledgers. The
combined `50`-violation reduction lowers aggregate Code Dojo debt from `62` to
`12` or lower.

Deliver the goalpost through bounded review tranches. Each tranche preserves
public entrypoints as typed compatibility facades, proves that its extracted
module family remains outside runtime import cycles, and lowers only the live
ledger entries it actually removes.

## Hill

The repository has `37` file/context violations and `25` code-size violations.
All `25` code-size offenders are also file/context offenders. Removing those
double-counted roots behind stable facades therefore satisfies the next
mandatory `50`-violation goalpost without weakening a threshold, adding an
exception, or changing public behavior.

The first tranche starts with five of the smaller double-counted roots:

- `packages/bijou-tui/src/eventbus.ts`
- `packages/bijou-tui/src/app-frame-actions.ts`
- `scripts/smoke-all-examples-lib.ts`
- `packages/bijou-i18n/src/runtime.ts`
- `packages/bijou-tui/src/timeline.ts`

Ledger edits are evidence after extraction. They are not the implementation.

## Current Truth

- Aggregate Code Dojo debt: `32`
- File/context baseline: `22`
- Mock-ban baseline: `0`
- Code-size baseline: `10`, including `3` hard-limit files
- ESLint baseline: `0`
- Required goalpost: `12` aggregate violations or lower
- Tranches A through C: `30` counted violations removed from `15` roots
- Remaining double-counted roots: `10`
- Tracker issue:
  [#480](https://github.com/flyingrobots/bijou/issues/480)
- Previous goalpost:
  [#477](https://github.com/flyingrobots/bijou/issues/477)
- V8 contract pull:
  [#459](https://github.com/flyingrobots/bijou/issues/459)

## Scope

- Bind the exact `25` double-counted roots in deterministic cycle evidence.
- Deliver those roots through bounded review tranches.
- Start tranche A with the five smaller roots named in this design.
- Preserve every selected public import path and export name.
- Keep mutable module state inside one implementation module unless an explicit
  port makes cross-module ownership safe.
- Keep overload declarations beside their implementation.
- Preserve source-debt identity across extracted implementation parts.
- Prove every changed split family remains absent from runtime import cycles.
- Remove ledger entries only after the live size gates accept the facade and
  extracted modules.
- Lower the package debt ceiling only to the measured live result.
- Update the exception ledger, changelog, roadmap, bearing, and cycle evidence
  in every tranche.

## Non-Goals

- No Profunctor Page feature implementation.
- No public API or behavior redesign.
- No opportunistic repair of pre-existing runtime cycles tracked by
  [#476](https://github.com/flyingrobots/bijou/issues/476).
- No new standards exception or large-file marker.
- No weakened threshold or aspirational ledger edit.
- No release tag or publication.

## Tranche A Contract

Tranche A removes five roots from both counted ledgers:

| Root | Existing responsibility boundary |
| :--- | :--- |
| `eventbus.ts` | Event-bus contracts, command lifecycle, queue diagnostics, and dispatch implementation. |
| `app-frame-actions.ts` | Frame action dispatch, pane navigation, viewport state, and transition commands. |
| `smoke-all-examples-lib.ts` | Scenario planning, execution, pooling, option parsing, and host adapters. |
| `runtime.ts` | I18n contracts, synchronous resolution, catalog composition, and asynchronous loading. |
| `timeline.ts` | Timeline contracts, position resolution, builder state, and compiled playback. |

The expected tranche result is:

- File/context baseline: `37 -> 32`
- Code-size baseline: `25 -> 20`
- Aggregate debt: `62 -> 52`
- Mock-ban baseline: `0`
- ESLint baseline: `0`

The overall WF-165 goalpost remains open after tranche A.

## Tranche B Contract

Tranche B removes the five smallest remaining roots from both counted ledgers:

| Root | Existing responsibility boundary |
| :--- | :--- |
| `packages/bijou-tui/src/runtime.ts` | Lifecycle contracts, the interactive render loop, shutdown draining, output buffers, and error emission. |
| `examples/perf-gradient/main.ts` | Telemetry charts, paint modes, frame assembly, interactive state, and process entry. |
| `packages/bijou-tui/src/driver.ts` | Script contracts, mouse-step builders, harness state, command observations, and script execution. |
| `packages/bijou/src/core/components/dag-render.ts` | DAG metrics, node glyphs, graph placement, edge highlighting, serialization, and fallback formats. |
| `packages/bijou-tui-app/src/index.ts` | Skeleton contracts, shell construction, chrome and overlays, page state and layout, and key-map helpers. |

The expected tranche-B result is:

- File/context baseline: `32 -> 27`
- Code-size baseline: `20 -> 15`
- Aggregate debt: `52 -> 42`
- Mock-ban baseline: `0`
- ESLint baseline: `0`

The selection is mechanical: these are the five smallest remaining entries in
the code-size baseline, and every one is also present in the file/context
baseline. The tranche does not redesign public behavior, change public exports,
add an exception, or introduce cache invalidation. Review hardening corrects
bounded runtime scheduling, shutdown, crash, modal, footer, and performance
chart defects exposed by the extraction. It also restores pre-split DAG detour
width, empty-badge, render-target adoption, deterministic noise, and harness
elapsed-time semantics. The overall WF-165 goalpost remains open after tranche
B.

## Tranche C Contract

Tranche C removes the five smallest remaining roots from both counted ledgers:

| Root | Existing responsibility boundary |
| :--- | :--- |
| `examples/_shared/canonical-app.ts` | Canonical workbench fixtures, page model and messages, pane renderers, page composition, and framed-app construction. |
| `examples/notifications/main.ts` | Notification demo contracts, state transitions, overlay geometry, mouse routing, notification lifecycle, and process entry. |
| `examples/image-viewer/main.ts` | Image-viewer contracts, file navigation, model updates, preview loading, raster controls, rendering, and process entry. |
| `scripts/pr-review-status.ts` | Pull-request and review contracts, check and review summaries, CodeRabbit status, merge readiness, GitHub retrieval, CLI parsing, and process entry. |
| `packages/bijou-tui/src/app-frame-render.ts` | Frame-render contracts, recursive layout rendering, pane geometry, header/help lines, transitions, surface normalization, and scratch ownership. |

The expected tranche-C result is:

- File/context baseline: `27 -> 22`
- Code-size baseline: `15 -> 10`
- Aggregate debt: `42 -> 32`
- Mock-ban baseline: `0`
- ESLint baseline: `0`

The selection is mechanical: these are the five smallest remaining entries in
the code-size baseline, and every one is also present in the file/context
baseline. Each original path remains a stable facade. Example process entry,
public exports, deterministic merge-readiness classification, notification
input behavior, image navigation and rendering, and framed-app output remain
unchanged. Review evidence additionally binds shared notification geometry,
RGB-only active-tab backgrounds, localized default frame titles, grapheme-safe
dividers, source-invalidated image-preview caching, and bounded active-tab token
caching. The overall WF-165 goalpost remains open after tranche C.

## Tranche D Contract

Tranche D removes the five smallest remaining roots from both counted ledgers:

| Root | Existing responsibility boundary |
| :--- | :--- |
| `packages/bijou/src/ports/surface.ts` | Cell and layout contracts, packed-cell encoding, masks, transforms, and mutable packed-surface construction. |
| `examples/docs/i18n-debt.ts` | Debt contracts and baselines, TypeScript source discovery, raw-string classification, Markdown localization inventory, and ratchet evaluation. |
| `packages/bijou-tui/src/app-frame-overlays.ts` | Help, settings, shell-theme, notification-center, focus, scroll, layout, and drawer-rendering behavior. |
| `packages/bijou/src/core/ui-scene-ir.ts` | Scene and receipt contracts, canonical hashing, validation, semantic lowering, cell source maps, and terminal proof. |
| `packages/bijou/src/core/render/differ.ts` | ANSI parsing and serialization, layout painting, cell equality, string and packed diffing, byte encoding, and batching. |

The expected tranche-D result is:

- File/context baseline: `22 -> 17`
- Code-size baseline: `10 -> 5`
- Aggregate debt: `32 -> 22`
- Mock-ban baseline: `0`
- ESLint baseline: `0`

The selection is mechanical: these are the five smallest remaining entries in
the code-size baseline, and every one is also present in the file/context
baseline. Each original path remains a stable facade. Public types, exports,
byte layouts, validation diagnostics, hashes, rendering behavior, localization
counts, terminal output, and performance-sensitive packed paths remain
unchanged. The overall WF-165 goalpost remains open after tranche D.

## Tranche E Contract

Tranche E removes the final five roots from the code-size ledger and from their
double-counted positions in the file/context ledger:

| Root | Existing responsibility boundary |
| :--- | :--- |
| `packages/bijou-tui/src/runtime-engine.ts` | Runtime contracts, subscriptions, scheduling, input dispatch, rendering, effects, cleanup, and engine lifecycle. |
| `packages/bijou/src/core/components/table.ts` | Table contracts, sizing, alignment, overflow, borders, pagination, selection, scrolling, and rendering. |
| `packages/bijou-tui/src/app-frame.ts` | Framed-app contracts, state, input, lifecycle, layout, rendering, overlays, notifications, shell themes, and public assembly. |
| `examples/docs/app.ts` | DOGFOOD application contracts, configuration, state, runtime wiring, input routing, rendering, and process lifecycle. |
| `examples/docs/stories.ts` | DOGFOOD story contracts, metadata, navigation, examples, panels, demonstrations, and story registry assembly. |

The expected tranche-E result is:

- File/context baseline: `17 -> 12`
- Code-size baseline: `5 -> 0`
- Aggregate debt: `22 -> 12`
- Mock-ban baseline: `0`
- ESLint baseline: `0`

The selection is exhaustive: these are the only remaining code-size entries,
and every one is also present in the file/context baseline. Each original path
remains a stable facade. Public types, exports, runtime lifecycle, table
semantics, framed-app behavior, DOGFOOD process behavior, story identity, and
rendered output remain unchanged. Tranche E closes the WF-165 `62 -> 12`
goalpost only after the live ledgers, family bounds, runtime-cycle proof,
documentation, and full repository gates agree.

## Implementation Outline

1. Add RED evidence for the exact active-tranche roots and target ledgers.
2. Extract cohesive declarations and behavior into focused adjacent modules.
3. Keep each original root as a stable compatibility facade.
4. Preserve behavior through existing focused suites and new export/size
   witnesses.
5. Prove that changed split families remain outside runtime import cycles.
6. Remove only the five proven roots from the file/context baseline.
7. Record each tranche's measured debt in the exception ledger and package
   ceiling.
8. Run documentation upkeep and the complete repository gate before review.
9. Close the goalpost only when all `25` double-counted roots are gone.

## Tests To Write First

- Assert that the exact five tranche-A roots leave the file/context ledger.
- Assert that the same five roots leave the code-size report.
- Assert that every tranche-A facade and implementation module is at most
  `150` lines and `12,000` bytes.
- Assert that every changed production family remains absent from runtime
  import cycles.
- Preserve focused behavioral tests for each touched public entrypoint.
- Assert that aggregate debt is exactly `52` after tranche A.
- Assert that aggregate debt is exactly `42` after tranche B.
- Assert that the exact five tranche-C roots leave both measured ledgers.
- Assert that every tranche-C facade and implementation module is at most
  `150` lines and `12,000` bytes.
- Assert that aggregate debt is exactly `32` after tranche C.
- Assert that the exact five tranche-D roots leave both measured ledgers.
- Assert that every tranche-D facade and implementation module is at most
  `150` lines and `12,000` bytes.
- Assert that aggregate debt is exactly `22` after tranche D.
- Assert that the exact five tranche-E roots leave both measured ledgers.
- Assert that every tranche-E facade and implementation module is at most
  `150` lines and `12,000` bytes.
- Assert that aggregate debt is exactly `12` after tranche E.

## Validation Plan

```bash
npx vitest run --config vitest.config.ts \
  tests/cycles/DX-050 \
  tests/cycles/RE-036 \
  tests/cycles/WF-130 \
  tests/cycles/WF-163 \
  tests/cycles/WF-164 \
  tests/cycles/WF-165
npm run code-dojo:verify
npm run typecheck
npm run lint
npm run lint:eslint
npm run docs:inventory
npm run test:run
git diff --check
```

## Acceptance Criteria

- All `25` double-counted roots leave both measured ledgers.
- Aggregate Code Dojo debt is `12` or lower.
- File/context and code-size ledgers match measured live files.
- Mock-ban and ESLint baselines remain `0`.
- Every selected public entrypoint preserves its export names.
- No changed split family participates in a runtime import cycle.
- No newly created file exceeds `150` lines or `12,000` bytes.
- Every tranche remains within the repository review-size policy.
- Full local and GitHub validation gates pass.
- Main at the resulting merge revision satisfies the next goalpost obligation
  before the V8 contract tracker closes.

## Playback Questions

1. Did every removed ledger entry correspond to a measured file reduction?
2. Did every compatibility facade preserve its public export names?
3. Are all changed split families absent from runtime import cycles?
4. Did the tranche preserve behavior instead of moving unbounded code into a
   differently named file?
5. Does the final combined evidence remove at least `50` counted violations?

## Accessibility And Assistive Posture

This is a structural standards cycle. Extracted modules preserve current text,
focus, lower-mode, and assistive semantics. No visual or interaction redesign
is in scope.

## Localization And Directionality Posture

Extracted modules preserve catalog keys, localized values, reading order, and
direction-sensitive behavior. The i18n runtime split must not change fallback,
interpolation, reference, locale, or direction resolution.

## Agent Inspectability And Explainability Posture

The exact target roots, tranche boundaries, live threshold checks,
runtime-cycle proof, aggregate ceiling, and current documentation agree. A
successor can identify every compatibility facade and implementation part
without reconstructing the goalpost from commit history.

## Linked Invariants

- [TypeScript Code Standards](../typescript-code-standards.editors-edition.md)
- [Code Dojo Exceptions](../code-dojo-exceptions.md)
- [Work Doctrine](../METHOD.md)
- [Documentation Standards](../DOCUMENTATION_STANDARDS.md)
- Tracker issue:
  [#480](https://github.com/flyingrobots/bijou/issues/480)

## Retrospective And Closeout

Open. Tranche A landed in
[#484](https://github.com/flyingrobots/bijou/pull/484). Five compatibility
facades now delegate to focused contract, state, execution, and adapter modules;
all facade exports remain stable, every family file is within the strict
context threshold, focused behavior suites pass, and repository runtime-cycle
analysis reports no cycle touching a changed family. The live ledgers move from
`37 + 25 = 62` to `32 + 20 = 52`.

Tranche B landed through
[#486](https://github.com/flyingrobots/bijou/pull/486). It applies the same
bounded extraction to the TUI runtime, performance gradient, scripted driver,
DAG renderer, and TUI-app skeleton. Their public
facades preserve the original exports while explicit family manifests bind the
focused implementation modules used for size and runtime-cycle evidence. The
review witness also binds behavior that the extraction initially drifted:
same-column DAG detours, middleware-replaced render targets, the original noise
permutation, empty DAG badges, and initialization-inclusive harness time. The
live ledgers move again to `27 + 15 = 42`. Fifteen double-counted roots remain
before the overall `62 -> 12` goalpost can close.

Tranche C is implemented in
[#487](https://github.com/flyingrobots/bijou/pull/487). The canonical example
app, Notifications, Image Viewer, PR review-status tool, and framed-app renderer
remain stable facades over focused implementation families. Exact public-export
and family manifests bind the compatibility surface, strict context thresholds,
and runtime-cycle proof. Review hardening shares compact notification geometry
between rendering and hit testing, preserves RGB-only active-tab backgrounds,
localizes the default frame title, keeps divider graphemes intact, removes an
orphan image-viewer mode message, and adds bounded caches for derived active-tab
tokens and rendered image previews. The preview cache binds its entries to the
source path, modification time, byte size, viewport, mode, and tuning so a
source-file rewrite invalidates stale output. The live ledgers move to
`22 + 10 = 32`; ten double-counted roots remain before the overall `62 -> 12`
goalpost can close.

Tranche D is implemented in
[#488](https://github.com/flyingrobots/bijou/pull/488). `Surface`, DOGFOOD
i18n-debt analysis, framed-app overlays, `ui-scene-ir/1`, and the terminal
differ remain stable public facades over the exact family manifests locked by
the tranche contract. Every family member stays within `150` lines and
`12,000` bytes, and repository runtime-cycle analysis finds no cycle touching
the changed families. The `Surface` witness preserves allocation-free numeric
RGB writes and covers negative source-origin clipping. The DOGFOOD scanner
retains `2,347` raw strings and `78` missing Markdown localizations while
excluding its own implementation family. The live ledgers now measure
`17 + 5 = 22`; no public API or rendering redesign entered scope. Five
double-counted roots remain for tranche E.
