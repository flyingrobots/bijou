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
- `DX-031` — the standard block release floor landed with public metadata,
  schema-bound block contracts, first-party `AppShell`, `ReaderSurface`, and
  `InspectorPanel` definitions, rendered multi-mode proof, block-tree
  rendering, and DOGFOOD Blocks preview evidence.
- `DX-034` — declarative view data binding landed with immutable snapshots and
  frames, provider scopes, view data contracts, AppShell composition, active
  binding lifecycle facts, active runtime binding collection, provider-update
  frame assembly, command intent routing, provider-bound AppShell proof, and
  DOGFOOD binding-state evidence.
- `DX-030` — boundary-aware selection and copy landed as pure
  `@flyingrobots/bijou` primitives: retained-geometry selection owners,
  viewport-aware ranges, semantic prose/surface/table/mixed-region extraction,
  higher-priority blocker arbitration, terminal-native fallback, and
  clipboard-effect records with no OS clipboard side effects.
- `DF-071` — DOGFOOD shell and docs surfaces moved further through semantic
  Block contracts, including block-owned surface inventory and localized
  inventory descriptions.
- `DF-030` — DOGFOOD now has a canonical docs surface Block contract:
  `DogfoodDocsSurfaceBlock` owns navigation, reader, search, proof artifact,
  command-intent, schema-bound input, and lower-mode fact truth for the docs
  app.
- `DF-039` through `DF-045` — the first DOGFOOD component-family six-pack now
  has standard Block contracts for framed grouping, explainability
  walkthroughs, formatted documents, linked destinations, dividers, and text
  entry state.
- `DF-046` through `DF-052` — the second DOGFOOD component-family six-pack now
  has standard Block contracts for single choice, multiple choice, binary
  decision, peer navigation, progressive disclosure, and path progress state.
- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — the first DOGFOOD-centered release boundary moved release smoke
  onto `smoke:dogfood` and closed the old temporary version-target lane.

## Active Gravity

### 1. Keep The `v6.0.0` Release Boundary Closed

- The live `v6.0.0` milestone has zero open tracker items and twenty-eight
  completed issue trackers. PR #257 closed the status/feedback Block slice:
  #220, #221, #222, #223, #224, and #225.
- The release thesis is still complete: frame owns geometry; Blocks prove it.
  The shipped proof now includes layout, standard Blocks, data binding,
  selection/copy, and status/feedback Blocks.
- `v6.0.0` should not tag until release-readiness validation and packaging
  checks are green.
- The detailed issue list lives in [ROADMAP.md](./ROADMAP.md).

### 2. GitHub Issues Are The Work Tracker

- GitHub Issues and milestones are now the canonical queue.
- `docs/method/backlog/` is evidence and lineage, not the primary planning UI.
- `ROADMAP.md` is the human-readable mirror of milestone triage, not an
  independent source of truth.
- Any issue moved between `v6.0.0`, `v7.0.0`, and `Beyond` should get a GitHub
  comment and a matching roadmap update.

### 3. `v7.0.0` Is The Active Product-Truth Horizon

- `v7.0.0` holds the imported `up-next` lane: DOGFOOD docs truth,
  component-family audits, `tableSurface()` responsive parity, and scoped
  Node I/O documentation.
- Its current open count is fourteen before this choice/navigation six-pack
  closes #232 through #237. After this PR merges, the remaining open v7 queue
  should be #245, #246, and the six remaining component-family audits #238
  through #243.
- DF-030 is the first product-truth slice: DOGFOOD's docs surface became one
  inspectable Block contract instead of adjacent docs rendering concepts. The
  component-family six-packs extend the standard Block catalog across grouping,
  explainability, document, navigation, structure, input, disclosure, and path
  progress families.
- The remaining v7 queue should be reshaped into smaller, issue-backed release
  slices rather than treated as one broad sweep.

## Tensions

- **Release Scope Creep**: `v6.0.0` is issue-complete. Do not reopen it for new
  feature work unless release-readiness validation uncovers a true blocker.
- **Geometry Before Product Chrome**: RE-035 has landed the release's
  structural layout floor. Remaining product-facing v6 work should consume
  geometry contracts, not bypass them with bespoke string/surface measurement.
- **Block Boundary Drift**: It is tempting to wrap every component in a Block.
  Blocks should own product semantics, data contracts, and lowering facts;
  Components should remain the leaf rendering vocabulary.
- **Tracker / Docs Drift**: The issue tracker, `ROADMAP.md`, and Method
  evidence files can now disagree. GitHub wins; docs must be updated when
  milestone triage changes.
- **DOGFOOD Truth Debt**: DF-030 converts the docs app into a named Block
  contract. The remaining v7 DOGFOOD work is still broad: table surface parity,
  scoped Node I/O docs, and the component-family audit queue need focused
  cycles with proof instead of prose-only closeouts.

## Next Target

The immediate focus is the active DOGFOOD choice/navigation standard Block
six-pack for [#232](https://github.com/flyingrobots/bijou/issues/232),
[#233](https://github.com/flyingrobots/bijou/issues/233),
[#234](https://github.com/flyingrobots/bijou/issues/234),
[#235](https://github.com/flyingrobots/bijou/issues/235),
[#236](https://github.com/flyingrobots/bijou/issues/236), and
[#237](https://github.com/flyingrobots/bijou/issues/237).

The PR must prove:

- `SingleChoiceBlock`, `MultipleChoiceBlock`, `BinaryDecisionBlock`,
  `PeerNavigationBlock`, `ProgressiveDisclosureBlock`, and
  `PathProgressBlock` metadata, data requirements, command intents, and
  schema-bound input validation
- visual/static rendering plus pipe and accessible lowerings with stable
  family, variant, selected, mode, and semantic-value facts
- DOGFOOD Blocks preview sample data for every new standard Block
- Method/design documentation with TUI and lower-mode mockups

Recommended pull order:

1. Finish and merge the #232 through #237 choice/navigation six-pack.
2. Run release-readiness validation against the now-closed v6 issue lane.
3. Pull the next v7 six-pack from #238 through #243, or take #245 / #246 if
   table parity or scoped Node I/O docs becomes higher leverage.

Non-goals for the next cycle:

- no broad DOGFOOD runtime rewrite
- no full remaining component-family audit sweep from `v7.0.0`
- no full visual redesign of DOGFOOD
- no conversion of every leaf component into a Block
- no hidden global block registry
- no localization runtime rewrite
