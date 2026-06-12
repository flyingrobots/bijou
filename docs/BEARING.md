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
- `DF-054` through `DF-059` — the late-family DOGFOOD component-family
  six-pack landed as standard Block contracts for brand emphasis, mode-aware
  primitives, dense comparisons, hierarchies, exploration lists, and
  temporal/dependency views.
- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — the first DOGFOOD-centered release boundary moved release smoke
  onto `smoke:dogfood` and closed the old temporary version-target lane.

## Active Gravity

### 0. Advance Runtime Graph And Scene IR From Proof To Pipeline

- `DX-043` and `DX-044` landed the portable `ui-scene-ir/1` seed and the first
  GraphQL-authored `bijou-block/1` proof for #302.
- The next active pull is `DX-045`: grouped GraphQL block authoring and
  deterministic debug facts. This keeps the work inside Bijou before crossing
  into Geordi endpoint implementation.
- The useful proof path is now:

  ```text
  GraphQL SDL
    -> bijou-block/1 grouped artifact
      -> ui-scene-ir/1
        -> terminal Surface proof
          -> debug summary facts
  ```

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

### 3. `v7.0.0` Is Issue-Complete Product Truth

- `v7.0.0` now has zero open milestone items and twenty-seven closed milestone
  items after the tracker-sync cleanup closes. The closed lineage includes
  DOGFOOD docs truth, completed component-family audits, `tableSurface()`
  responsive parity, scoped Node I/O documentation, BlockLab naming, workflow
  evidence, the DOGFOOD release-title proof surface, and post-merge review
  regression fixes.
- The next release-facing action is release-readiness validation against the
  issue-complete V7 Product Truth lane.
- DF-030 is the first product-truth slice: DOGFOOD's docs surface became one
  inspectable Block contract instead of adjacent docs rendering concepts. The
  component-family six-packs extend the standard Block catalog across grouping,
  explainability, document, navigation, structure, input, disclosure, and path
  progress families. V7 Product Truth closes the release-facing gap: the docs
  app now has a release identity that points at shipped proof lanes.

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
  contract. The current V7 DOGFOOD proof lane is issue-complete; any new
  DOGFOOD truth work should be shaped as a new release lane or a Beyond issue
  rather than reopening the closed V7 closeout queue.

## Next Target

The immediate feature focus is the `DX-045` grouped GraphQL block pipeline for
#302. Release-readiness validation remains the release-boundary focus for the
closed V6 and V7 lanes, but the next implementation branch should avoid
reopening those issue-complete milestones.

The `DX-045` validation pass must prove:

- grouped SDL compiles into deterministic `bijou-block/1` group facts
- grouped block artifacts lower into valid `ui-scene-ir/1`
- terminal proof preserves source maps, tokens, i18n keys, actions, bindings,
  lower modes, and receipt hashes
- debug summary facts are inspectable without screenshots or host-specific
  paths

The release-readiness validation pass must prove:

- release-readiness checks pass against the closed V6 and V7 lanes
- BEARING and ROADMAP mirror the live V7 tracker
- no unresolved review comments or failed CI remain from the closeout PRs
- package/version metadata is ready for the release boundary

Recommended pull order:

1. Land `DX-045` grouped GraphQL block authoring and debug facts for #302.
2. Run release-readiness validation against the now-closed V6 and V7 lanes.
3. Cut release title treatment variants for the next release boundary only
   after the tracker, docs, and CI proof are green.

Non-goals for the next cycle:

- no broad DOGFOOD runtime rewrite
- no full remaining component-family audit sweep from `v7.0.0`
- no full visual redesign of DOGFOOD beyond the release-title guide
- no conversion of every leaf component into a Block
- no hidden global block registry
- no localization runtime rewrite
