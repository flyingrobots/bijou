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

### 3. Localization Port Before More View-Level Lookup

- English fallback is separate from selected-locale catalogs.
- Missing selected-locale strings are now real missing data, not disguised
  English.
- DOGFOOD now needs an app-facing localization port so views ask for localized
  objects instead of depending directly on the concrete i18n runtime.

## Tensions

- **View-Level Runtime Leakage**: DOGFOOD still passes the concrete i18n
  runtime through rendering helpers for ordinary text lookup.
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
[LX-019 — Localization Port Contract](./design/LX-019-localization-port-contract.md).

LX-019 should stay boundary-focused:

- define the application-facing `LocalizationPort` in `@flyingrobots/bijou-i18n`
- return structured localized objects instead of naked strings
- keep catalog/file loading in adapters
- keep DOGFOOD runtime composition at the app boundary
- migrate DOGFOOD text helpers to the port

Non-goals for the next cycle:

- no localization dashboard
- no translation workbench
- no portable preference system
- no broad catalog expansion
- no remote localization service

Expected sequence:

1. `LX-019` puts application-facing localization lookup behind a port.
2. Remaining DOGFOOD text surfaces continue moving into catalogs.
3. Blocks product proof resumes with less view-level localization leakage.
