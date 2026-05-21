# BEARING

Current direction and active tensions. Historical ship data is in `CHANGELOG.md`.

## Recent Ships

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

### 3. Localization Coverage Before Preference Polish
- English fallback is separate from selected-locale catalogs.
- Missing selected-locale strings are now real missing data, not disguised
  English.
- The next value comes from moving visible DOGFOOD strings into the source
  string table and regenerating honest locale catalogs.

## Tensions

- **Visible English Debt**: DOGFOOD still has too many hard-coded English strings
  in navigation, settings, Blocks docs, preview chrome, common actions, and
  status labels.
- **Product Proof Lag**: Blocks have better contracts than visible rendered
  proof. AppShell rendering must consume existing data-flow contracts instead of
  creating a parallel prop/callback path.
- **Persistence Timing**: Locale preference persistence matters, but it is less
  valuable until enough of DOGFOOD visibly responds to locale changes.
- **Measurement Temptation**: A localization dashboard would be useful, but
  coverage must improve before a dashboard becomes the next highest-value move.

## Next Target

The immediate focus is
[LX-014 — Expand DOGFOOD Catalog Coverage](./method/backlog/asap/LX-014-expand-dogfood-catalog-coverage.md).

LX-014 should stay product-facing and narrow:

- move visible DOGFOOD strings into the source string table
- cover top navigation, settings/menu labels, Blocks docs, Blocks preview
  chrome, Counter demo labels, i18n docs, common actions, and common
  loading/empty/error/status labels
- regenerate locale catalogs without copying English fallback data into
  non-English payloads
- ratchet hard-coded localization debt down
- preserve the existing runtime fallback policy

Non-goals for the next cycle:

- no locale preference persistence
- no localization dashboard
- no translation workbench
- no portable preference system
- no new Blocks architecture
- no rendered AppShell work
- no broad standard Block catalog expansion

Expected sequence:

1. `LX-014` expands visible DOGFOOD catalog coverage.
2. `LX-013` persists selected locale through a port/adapter.
3. Blocks product proof resumes with less visible localization debt underneath
   the showcase.
