# BEARING

Current direction and active tensions. Historical ship data is in `CHANGELOG.md`.

## Recent Ships

- `LX-014` — DOGFOOD catalog coverage expanded across visible product
  surfaces, making locale switching more useful while preserving honest
  selected-locale catalog data.
- `LX-018` — localization catalog data is now honest: generated non-English
  DOGFOOD catalogs do not embed copied English fallback strings, English
  fallback catalogs load separately at runtime, and non-production builds can
  expose loud missing-localization markers.
- `DX-031` / `DX-034` — Blocks now have public metadata, schema, data-binding,
  command-intent, lifecycle, active-binding, first-party definition, DOGFOOD
  documentation, and fixture-demo proof. The visible product layer is still
  emerging; the architecture is ahead of the rendered catalog.
- `LX-019` — DOGFOOD text lookup now goes through an application-facing
  localization port instead of view code reaching for the concrete runtime.
- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — DOGFOOD matures through
  [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md),
  [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md),
  [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md),
  and [WF-003](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md).

## Active Gravity

### 1. Visible DOGFOOD Product Truth
- DOGFOOD now exposes two partially visible product surfaces at once: Blocks and
  localization.
- The next work should improve what users can see in DOGFOOD before adding
  another abstract layer.
- The localization pipeline is honest; the bottleneck is visible catalog
  coverage.

### 2. Blocks Crossing From Contracts To Product
- Blocks have a strong data-flow and composition spine.
- `AppShell`, `ReaderSurface`, `InspectorPanel`, and the fixture
  `CounterDemoBlock` prove the path, but the rendered standard catalog is not
  finished.
- New Block work should consume the existing contracts, not invent provider,
  lifecycle, callback, or localization policy while rendering.

### 3. DOGFOOD Becomes Block-Authored

- DOGFOOD should prove Bijou's Block system by using Blocks for semantic app
  surfaces, not merely previewing Blocks in one section.
- Components remain the leaf rendering vocabulary inside Blocks.
- Storybook should move onto the shared framed shell path and expose a
  `StorybookWorkbenchBlock` contract instead of staying a parallel bespoke TUI.

## Tensions

- **Block Boundary Drift**: It is tempting to wrap every component in a Block.
  That would blur the useful boundary; Blocks should own product semantics,
  while components own leaf rendering.
- **Product Proof Lag**: Blocks have better contracts than visible rendered
  proof. AppShell rendering must consume existing data-flow contracts instead of
  creating a parallel prop/callback path.
- **Coverage Still Matters**: Catalog coverage has improved, but future visible
  product work should keep moving text into the source table instead of adding
  new hard-coded strings.
- **Measurement Temptation**: A localization dashboard would be useful, but
  coverage must improve before a dashboard becomes the next highest-value move.

## Next Target

The immediate focus is
[DF-069 — Block-Authored DOGFOOD](./design/DF-069-block-authored-dogfood.md).

DF-069 should stay product-composition focused:

- move Storybook toward the framed shell path
- introduce DOGFOOD Blocks for semantic app/page surfaces
- keep low-level components as rendering primitives inside Blocks
- preserve unidirectional data-binding and localization-port boundaries

Non-goals for the next cycle:

- no full visual redesign of DOGFOOD
- no conversion of every leaf component into a Block
- no hidden global block registry
- no new provider lifecycle system
- no localization runtime rewrite

Expected sequence:

1. `DF-069` makes the next DOGFOOD proof block-authored at semantic boundaries.
2. Storybook moves onto the same framed-shell model.
3. DOGFOOD pages migrate to Blocks incrementally, starting with title,
   navigation, documentation article, settings, block preview, and inspector
   surfaces.
