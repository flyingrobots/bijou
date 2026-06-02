# BEARING

Current direction and active tensions. Historical ship data is in
`CHANGELOG.md`; issue-by-release mapping is in `ROADMAP.md`.

## Recent Ships

- `RE-035` — mandatory layout envelope and constraint negotiation landed as a
  pure `@flyingrobots/bijou` layout floor: immutable constraints, preferences,
  assigned rectangles, stack/place proof helpers, content measurement seams,
  render-facing assigned-rect gating, and explanation facts.
- `DX-036` — responsive `table()` layout, width fitting, visual table variants,
  explicit pipe formats, and DOGFOOD documentation jump search have landed.
- Day 0 audit hardening — onboarding, Method intake, cross-platform CI posture,
  DOGFOOD terminal guardrails, bootstrap diagnostics, command backpressure, and
  render-pipeline diagnostics have been tightened.
- `DF-022` / `DF-023` / `DF-024` and `WF-003` — DOGFOOD followed through on
  the terminal documentation system shape with the prose docs reader, top-level
  navigation, package/release guides, philosophy/architecture guides, and
  DOGFOOD-backed smoke closure.
- `LX-014` — DOGFOOD catalog coverage expanded across visible product
  surfaces, making locale switching more useful while preserving honest
  selected-locale catalog data.
- `LX-018` / `LX-019` — localization catalog data is honest, fallback catalogs
  are explicit, and DOGFOOD text lookup now goes through an application-facing
  localization port.
- `DX-031` / `DX-034` — Blocks now have public metadata, schema, data-binding,
  command-intent, lifecycle, active-binding, first-party definition, DOGFOOD
  documentation, and fixture-demo proof. The visible product layer is still
  emerging; the architecture is ahead of the rendered catalog.
- `DF-071` — DOGFOOD shell and docs surfaces moved further through semantic
  Block contracts, including block-owned surface inventory and localized
  inventory descriptions.
- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — the first DOGFOOD-centered release boundary moved release smoke
  onto `smoke:dogfood` and closed the old temporary version-target lane.

## Active Gravity

### 1. Close The `v6.0.0` Release Boundary

- The live `v6.0.0` milestone has three open tracker items plus twenty-one
  completed lineage trackers after RE-035 and the Vitest dependency hygiene
  work landed.
- The release thesis is still: frame owns geometry; Blocks prove it.
- `v6.0.0` should not tag until the remaining open release issues are closed,
  intentionally split, or explicitly moved to another horizon.
- The detailed issue list lives in [ROADMAP.md](./ROADMAP.md).

### 2. GitHub Issues Are The Work Tracker

- GitHub Issues and milestones are now the canonical queue.
- `docs/method/backlog/` is evidence and lineage, not the primary planning UI.
- `ROADMAP.md` is the human-readable mirror of milestone triage, not an
  independent source of truth.
- Any issue moved between `v6.0.0`, `v7.0.0`, and `Beyond` should get a GitHub
  comment and a matching roadmap update.

### 3. `v7.0.0` Is The Queued Product-Truth Horizon

- `v7.0.0` holds the imported `up-next` lane: DOGFOOD docs truth,
  component-family audits, `tableSurface()` responsive parity, and scoped
  Node I/O documentation.
- This is initial triage, not a release promise.
- After `v6.0.0` closes, v7 should be reshaped into a smaller release thesis
  before implementation starts.

## Tensions

- **Release Scope Creep**: `v6.0.0` is close enough to become tempting to
  widen. Resist that. Close, split, or move the remaining issues instead of
  dragging v7 work into the current release boundary.
- **Geometry Before Product Chrome**: RE-035 has landed the release's
  structural layout floor. Remaining product-facing v6 work should consume
  geometry contracts, not bypass them with bespoke string/surface measurement.
- **Block Boundary Drift**: It is tempting to wrap every component in a Block.
  Blocks should own product semantics, data contracts, and lowering facts;
  Components should remain the leaf rendering vocabulary.
- **Tracker / Docs Drift**: The issue tracker, `ROADMAP.md`, and Method
  evidence files can now disagree. GitHub wins; docs must be updated when
  milestone triage changes.
- **DOGFOOD Truth Debt**: `v7.0.0` carries a large docs and component-family
  audit queue. That work matters, but it should not obscure the smaller v6
  release gate.

## Next Target

The immediate focus is `v6.0.0` release closure.

Open v6 tracker items:

- [#181](https://github.com/flyingrobots/bijou/issues/181) — `DX-031`
  standard Bijou blocks.
- [#182](https://github.com/flyingrobots/bijou/issues/182) — `DX-034`
  declarative view data binding.
- [#186](https://github.com/flyingrobots/bijou/issues/186) — `DX-030`
  boundary-aware pointer selection and copy.

Recommended pull order:

1. Reassess [#181](https://github.com/flyingrobots/bijou/issues/181) and
   [#182](https://github.com/flyingrobots/bijou/issues/182) together after
   RE-035, because standard Blocks and declarative binding are already
   partially landed and may need split-or-close decisions rather than one broad
   cycle.
2. Treat [#186](https://github.com/flyingrobots/bijou/issues/186) as either a
   focused v6 implementation slice or an explicit move to `v7.0.0`, depending
   on whether boundary-aware copy is required for the release boundary.

Non-goals for the next cycle:

- no broad DOGFOOD docs ingestion from [#244](https://github.com/flyingrobots/bijou/issues/244)
  unless it is explicitly moved into v6
- no remaining component-family audit sweep from `v7.0.0`
- no full visual redesign of DOGFOOD
- no conversion of every leaf component into a Block
- no hidden global block registry
- no localization runtime rewrite
