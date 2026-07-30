# BEARING

Current direction and active tensions. Historical ship data is in
`CHANGELOG.md`; issue-by-release mapping is in `ROADMAP.md`.

## Recent Ships

- `7.2.0` — demo-integrity stabilization shipped: TUI mouse tracking and
  fallthrough repairs, public page-scoped frame helpers, scripted mouse driver
  builders, DOGFOOD release-story surfaces, Blocks app-binding snippets,
  theme/localization demo readiness, dependency audit cleanup, and Code Dojo
  ratchet progress.
- `7.1.0` — post-V7 portable UI proof shipped: `ui-scene-ir/1`,
  GraphQL-authored `bijou-block/1` artifacts, grouped block debug facts, a real
  DOGFOOD NavigationListBlock fixture, terminal-rendering fixes, and
  release-readiness / DOGFOOD i18n guardrails.
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
- `DX-043` through `DX-045` — the Runtime Graph and Scene IR lane now has a
  portable `ui-scene-ir/1` seed, a constrained GraphQL-authored
  `bijou-block/1` proof, grouped block authoring, and deterministic
  `graphql-bijou-block-debug/1` facts for #302.
- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — the first DOGFOOD-centered release boundary moved release smoke
  onto `smoke:dogfood` and closed the old temporary version-target lane.

## Active Gravity

### 0. Advance Runtime Graph And Scene IR From Proof To Product Fixture

- `DX-043`, `DX-044`, `DX-045`, and `DX-046` landed the portable
  `ui-scene-ir/1` seed,
  the first GraphQL-authored `bijou-block/1` proof, grouped block authoring,
  deterministic debug facts, and the first real GraphQL-authored DOGFOOD
  NavigationListBlock fixture for #302.
- The broad #302 tracker now lives in `v8.0.0` with the VISOR Runtime Graph
  and Scene IR contract work. The v7.1 feature proof and release-prep
  guardrails are complete release lineage, not the full Runtime Graph product.
- The proof path that v7.1 now carries is:

  ```text
  GraphQL SDL fixture
    -> bijou-block/1 grouped artifact
      -> ui-scene-ir/1
        -> terminal Surface proof
          -> graphql-bijou-block-debug/1 facts
            -> DOGFOOD product facts
  ```

### 1. Keep The Release Posture Honest

- The latest shipped public release is `v7.2.0`, published from the
  demo-integrity release packet on 2026-07-05.
- The `v6.0.0`, `v7.0.0`, `v7.1.0`, and `v7.2.0` GitHub milestone lanes are
  complete release lineage, not the next implementation target.
- `v7.2.0` completed as a narrow stabilization and demo-integrity release, not
  as a broad feature train.
- The first `v7.2.0` demo-integrity pull was RE-041: fix framework mouse
  fallthrough (#344), expose page-scoped frame helpers (#345), and add scripted
  mouse builders (#353).
- The **Respectful Repo: Enter the Code Dojo** goalpost has landed. The
  repository now lives under the verbatim
  [TypeScript Code Standards Editor's Edition](./typescript-code-standards.editors-edition.md)
  artifact with enforceable baselines for existing file/context, mega-file, and
  mock-ban debt. The active exception ledger is
  [Code Dojo Exceptions](./code-dojo-exceptions.md): every met goalpost must
  remove at least 50 counted violations until the aggregate count reaches zero.
- The localization (#340), DOGFOOD shell polish (#334), and light-theme
  readiness (#341) repairs have landed as v7.2.0 demo-integrity lineage.
- The Blocks app-binding (#342) and first-party theme variant (#343) repairs
  have landed as v7.2.0 demo-integrity lineage.
- The selected `v7.2.0` DOGFOOD product pull #335 has landed: release-story
  surfaces now stay inside DOGFOOD's main reader flow so What's New, the real
  GraphQL proof chain, and changelog history are visible without wide-only side
  metadata.
- The next feature horizon remains `v8.0.0`: the Runtime Graph and Scene IR
  product contract built from the proof chain that v7.1.0 shipped and the
  release surface that v7.2.0 stabilized.
- The detailed release-horizon index lives in [ROADMAP.md](./ROADMAP.md), and
  the release process lives in [release.md](./release.md).

### 2. GitHub Issues Are The Work Tracker

- GitHub Issues and milestones are now the canonical queue.
- `docs/method/backlog/` is evidence and lineage, not the primary planning UI.
- `ROADMAP.md` is the human-readable mirror of milestone triage, not an
  independent source of truth.
- Any issue or pull request moved between release horizons, including
  `v7.1.0`, `v7.2.0`, `v8.0.0`, `v8.1.0`, `v8.2.0`, `v9.0.0`, `v10.0.0`,
  `Beyond`, or historical `v6.0.0` / `v7.0.0` lanes, should get a GitHub
  comment and a matching roadmap update.

### 3. Keep Future Releases Explicit

- The `v7.2.0` milestone is complete release lineage: 0 open and 19 closed
  milestone items as of the latest roadmap sync.
- The `v8.0.0` milestone is the active feature horizon: 2 open milestone items
  and 2 closed milestone items as of the latest roadmap sync.
- The `v8.1.0` milestone is replay, capture, debugger, and render-witness
  follow-through: 13 open and 0 closed milestone items.
- The `v8.2.0` milestone is quality automation and Method hardening: 21 open
  and 2 closed milestone items.
- The `v9.0.0` milestone is Product Workbench and operator surfaces: 20 open
  and 0 closed milestone items.
- The `v10.0.0` milestone is renderer and host-systems integration: 9 open and
  1 closed milestone item.
- The `Beyond` milestone is now a parking lane, not the active queue: 0 open
  and 6 closed milestone items as of the latest roadmap sync.
- No open issue is currently unmilestoned; keep open unmilestoned searches
  empty unless a maintainer is deliberately shaping work before release
  assignment.
- Stale completed work-in-progress issues
  [#450](https://github.com/flyingrobots/bijou/issues/450) and
  [#383](https://github.com/flyingrobots/bijou/issues/383) were verified
  against merged implementation PRs
  [#451](https://github.com/flyingrobots/bijou/pull/451) and
  [#384](https://github.com/flyingrobots/bijou/pull/384), assigned to
  `v7.2.0`, commented, and closed as completed.
- `v7.2.0` must stay closed to the framework input and DOGFOOD demo-integrity
  issues selected in #354, plus narrow security repairs such as #357.
- `v8.0.0` should organize Runtime Graph And Scene IR into a product contract:
  versioned `bijou-block/1`, `ui-scene-ir/1`, receipts, source maps, lower
  modes, debug facts, DOGFOOD round-trip fixtures, and capture evidence.
- `v8.1.0` should harden replay, capture, debugger, render-witness, and Runtime
  Graph visualization proof after the first V8 contract lands.
- `v8.2.0` should make Code Dojo, Method, tracker sync, and fixture-backed test
  gates easier to inspect and harder to drift.
- `v9.0.0` should organize the Product Workbench and operator surfaces:
  BlockLab, DOGFOOD drawer/focus language, Theme Lab and Theme Inspector
  provenance, localization operations, artifact matrices, and product-review
  docs.
- `v10.0.0` should hold Geordi/Wesley follow-through, renderer and host
  systems, terminal shader/raster work, native-surface foundations, and
  advanced host input controls.

## Tensions

- **Closed Release Gravity**: `v6.0.0`, `v7.0.0`, `v7.1.0`, and `v7.2.0` are
  complete release lineage. Do not use those lanes for new feature work.
- **Minor-Release Temptation**: Do not reopen `v7.2.0` as a full feature train.
  Adding a full workbench, theme lab, localization suite, Wesley path, or
  Geordi path turns the work into `v9.0.0` or `v10.0.0` scope.
- **Geometry Before Product Chrome**: RE-035 landed the structural layout floor.
  New product-facing work should consume geometry contracts, not bypass them
  with bespoke string/surface measurement.
- **Block Boundary Drift**: It is tempting to wrap every component in a Block.
  Blocks should own product semantics, data contracts, and lowering facts;
  Components should remain the leaf rendering vocabulary.
- **Tracker / Docs Drift**: The issue tracker, `ROADMAP.md`, and Method
  evidence files can now disagree. GitHub wins; docs must be updated when
  milestone triage changes.
- **DOGFOOD Truth Debt**: DF-030 converted the docs app into a named Block
  contract. New DOGFOOD truth work should be shaped as a post-v7 candidate
  goalpost or a Beyond issue rather than reopening the closed V7 queue.
- **Unmilestoned Regression Risk**: Open unmilestoned work is currently empty.
  Work with `work-in-progress`, `roadmap`, or `needs-design` labels but no
  milestone must be made explicit before agents treat it as a release target.

## Next Target

The Code Dojo ratchet
[#477](https://github.com/flyingrobots/bijou/issues/477) has met its
`112 -> 62` contract. Landed tranche A
[#475](https://github.com/flyingrobots/bijou/pull/475) and landed tranche B
[#478](https://github.com/flyingrobots/bijou/pull/478) each removed `25`
counted violations. Current debt comprises `32` file/context and `20`
code-size violations with no mock-ban or ESLint debt.

The bounded target
[#468](https://github.com/flyingrobots/bijou/issues/468) landed through
[#474](https://github.com/flyingrobots/bijou/pull/474). It consumes the
canonical website specimen through Bijou-owned `ui-scene-ir/1`, layout,
`Surface`, source-map, and receipt boundaries. Its completed cycle design is
[DX-050](./design/DX-050-profunctor-page-inspection.md).

The #458 GraphQL block artifact bundle and #459 packed-cell `Surface` adapter
have landed as the two bounded V8 implementation proofs. Their cycle designs
remain [DX-049](./design/DX-049-visor-artifact-bundle-proof.md) and
[RE-036](./design/RE-036-packed-bijou-cells-surface-adapter.md).

The active prerequisite is
[#480](https://github.com/flyingrobots/bijou/issues/480): remove the `25`
double-counted code-size roots and lower aggregate Code Dojo debt from `62` to
`12` or less through bounded
[WF-165](./design/WF-165-respecting-dojo-ratchet-12.md) tranches. Landed
tranche A [#484](https://github.com/flyingrobots/bijou/pull/484) removed five
smaller double-counted roots and lowered the enforced intermediate ceiling to
`52`. Twenty double-counted roots remain; tranche B is the next bounded pull.
V8 tracker closeout and release preparation follow the completed `62 -> 12`
goalpost. Rendering-cache authority debt is tracked separately in
[#485](https://github.com/flyingrobots/bijou/issues/485); cache reuse remains
out of scope until revision- or digest-based invalidation is explicit.

```text
VISOR v8 tracker (#457)
  -> landed GraphQL block artifact bundle (#458)
    -> bijou-block/1 artifact contract
      -> ui-scene-ir/1 lowering contract
        -> receipts, source maps, lower modes, and debug facts
          -> landed packed-cell Surface adapter (#459)
```

The proof chain that V7 shipped must become a product contract before Bijou
pulls in broad Geordi, Wesley, browser, or native-render work:

```text
GraphQL SDL fixture
  -> bijou-block/1 grouped artifact
    -> ui-scene-ir/1
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
          -> DOGFOOD product facts
```

Recommended pull order:

1. Treat the bounded Profunctor Page inspection proof in #468 as landed.
2. Treat #458 as landed v8 foundation: the GraphQL block artifact bundle,
   replay facts, and visual scene facts are implemented.
3. Treat #459 as landed through PR #483: `packed-bijou-cells/1` now validates
   and adapts into a synchronized terminal `Surface`.
4. Pull #480 through bounded WF-165 tranches until Code Dojo debt reaches `12`
   or less.
5. Close #302 and #457 only after merged goalpost evidence and V8 contract
   closeout agree.
6. Use `v8.1.0` for replay, capture, debugger, render-witness, and graph proof
   follow-through after V8 lands.
7. Use `v8.2.0` for Code Dojo, Method, tracker-sync, and fixture-backed quality
   automation.
8. Keep `v9.0.0` for Product Workbench and operator surfaces after V8
   stabilizes the source/artifact/IR contract.
9. Keep `v10.0.0` for Geordi/Wesley, renderer, host, shader, raster, and native
   surface work after the Bijou contracts are proven.
10. Keep closed dependency PR #326 as superseded lineage, not active release
   work.

Non-goals for the next cycle:

- no broad feature-train `v7.2.0`
- no broad DOGFOOD runtime rewrite
- no full remaining component-family audit sweep from `v7.0.0`
- no full visual redesign of DOGFOOD as a post-release cleanup for `v7.1.0`
- no conversion of every leaf component into a Block
- no hidden global block registry
- no localization runtime rewrite
- no Wesley or Geordi repository changes before the DOGFOOD fixture proves the
  Bijou-side source, artifact, IR, and debug contracts
