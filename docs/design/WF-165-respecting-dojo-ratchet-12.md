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

- Aggregate Code Dojo debt: `52`
- File/context baseline: `32`
- Mock-ban baseline: `0`
- Code-size baseline: `20`, including `3` hard-limit files
- ESLint baseline: `0`
- Required goalpost: `12` aggregate violations or lower
- Tranche A result: `10` counted violations removed from `5` roots
- Remaining double-counted roots: `20`
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
baseline. The tranche does not introduce a behavior change, public export
change, new exception, or cache optimization. The overall WF-165 goalpost
remains open after tranche B.

## Implementation Outline

1. Add RED evidence for the exact active-tranche roots and target ledgers.
2. Extract cohesive declarations and behavior into focused adjacent modules.
3. Keep each original root as a stable compatibility facade.
4. Preserve behavior through existing focused suites and new export/size
   witnesses.
5. Prove that changed split families remain outside runtime import cycles.
6. Remove only the five proven roots from the file/context baseline.
7. Record measured `52` debt in the exception ledger and package ceiling.
8. Run documentation upkeep and the complete repository gate before review.
9. Repeat bounded tranches until all `25` double-counted roots are gone.

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
`37 + 25 = 62` to `32 + 20 = 52`. Twenty double-counted roots remain before the
overall `62 -> 12` goalpost can close.
