# BEARING

Current direction and active tensions. Historical ship data is in
`CHANGELOG.md`; issue-by-release mapping is in `ROADMAP.md`.

## Recent Ships

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
- The broad #302 tracker remains in `Beyond` for V8. The v7.1 feature proof and
  release-prep guardrails are complete release lineage, not the full Runtime
  Graph product.
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

- The latest shipped public release is `v7.1.0`, published from the post-V7
  release packet on 2026-06-14.
- The `v6.0.0`, `v7.0.0`, and `v7.1.0` GitHub milestone lanes are complete
  release lineage, not the next implementation target.
- `v7.2.0` is now selected as a narrow stabilization and demo-integrity release,
  not as a broad feature train.
- The first `v7.2.0` demo-integrity pull was RE-041: fix framework mouse
  fallthrough (#344), expose page-scoped frame helpers (#345), and add scripted
  mouse builders (#353).
- Before the next `v7.2.0` pull, the active goalpost is **Respectful Repo:
  Enter the Code Dojo**. The repository must live under the verbatim
  [TypeScript Code Standards Editor's Edition](./typescript-code-standards.editors-edition.md)
  artifact with enforceable baselines for existing file/context, mega-file, and
  mock-ban debt. The active exception ledger is
  [Code Dojo Exceptions](./code-dojo-exceptions.md): every met goalpost must
  remove at least 50 counted violations until the aggregate count reaches zero.
- DL-018 remains the next `v7.2.0` product pull after the Code Dojo gate is
  enforceable: make DOGFOOD first-party shell themes declare paired or
  single-mode coverage, and make unsupported theme-mode toggles explicit for
  #343.
- The next feature horizon remains `v8.0.0`: the Runtime Graph and Scene IR
  product contract built from the proof chain that v7.1.0 shipped.
- The detailed release-horizon index lives in [ROADMAP.md](./ROADMAP.md), and
  the release process lives in [release.md](./release.md).

### 2. GitHub Issues Are The Work Tracker

- GitHub Issues and milestones are now the canonical queue.
- `docs/method/backlog/` is evidence and lineage, not the primary planning UI.
- `ROADMAP.md` is the human-readable mirror of milestone triage, not an
  independent source of truth.
- Any issue or pull request moved between release horizons, including
  `v7.1.0`, `v7.2.0`, `v8.0.0`, `v9.0.0`, `Beyond`, or historical `v6.0.0` /
  `v7.0.0` lanes, should get a GitHub comment and a matching roadmap update.

### 3. Stabilize V7.2, Then Shape V8 And V9 From Beyond

- The `v7.2.0` milestone is the current active stabilization lane: 6 open and
  8 closed milestone items as of the latest roadmap sync.
- The `Beyond` milestone is the current post-v7 backlog: 31 open and 6 closed
  milestone items as of the latest roadmap sync.
- `v7.2.0` should stay bounded to the framework input and DOGFOOD demo-integrity
  issues selected in #354, plus narrow security repairs such as #357.
- `v8.0.0` should organize Runtime Graph And Scene IR into a product contract:
  versioned `bijou-block/1`, `ui-scene-ir/1`, receipts, source maps, lower
  modes, debug facts, DOGFOOD round-trip fixtures, and capture evidence.
- `v9.0.0` should organize the Product Workbench and operator surfaces:
  BlockLab, Theme Lab and Theme Inspector provenance, localization operations,
  artifact matrices, and terminal input controls if #316 becomes product scope.
- Unmilestoned work such as the fluid-triangle title direction, Theme Inspector
  pointer provenance, keyboard transport, playback harness, and technical
  teardown gate should be shaped before being treated as release work.

## Tensions

- **Closed Release Gravity**: `v6.0.0`, `v7.0.0`, and `v7.1.0` are complete
  release lineage. Do not use those lanes for new feature work.
- **Minor-Release Temptation**: Do not let `v7.2.0` become a full feature train.
  Adding a full workbench, theme lab, localization suite, Wesley path, or Geordi
  path turns the work into V8/V9 scope.
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
- **Unmilestoned WIP**: Work with `work-in-progress`, `roadmap`, or
  `needs-design` labels but no milestone must be made explicit in roadmap
  triage before agents treat it as a release target.

## Next Target

Before returning to `v7.2.0` stabilization, the immediate focus is
**Respectful Repo: Enter the Code Dojo**.

The current pull is a standards gate:

```text
TypeScript Code Standards artifact
  -> Code Dojo scripts, hooks, and CI
    -> file/context and mock-ban baselines
      -> 50-violation goalpost burndown until zero
```

After `v7.2.0` stabilizes the current V7 surface, V8 must turn the proof chain
into product contract:

```text
GraphQL SDL fixture
  -> bijou-block/1 grouped artifact
    -> ui-scene-ir/1
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
          -> DOGFOOD product facts
```

Recommended pull order:

1. Land Respectful Repo: Enter the Code Dojo so standards enforcement is active
   before more product work lands.
2. Land DL-018 for #343 so DOGFOOD first-party theme mode coverage is honest,
   visible, and covered by deterministic AppShell feedback tests.
3. Move through the remaining selected `v7.2.0` DOGFOOD demo-integrity items
   from #354.
4. Run the normal `v7.2.0` release-prep checklist before any tag is created.
5. Shape #302 into a V8 design packet with artifact semantics, receipt
   invariants, source-map ownership, lower-mode contracts, and failure cases.
6. Promote only the Runtime Graph and Scene IR issues needed for that contract
   out of `Beyond`.
7. Keep `v9.0.0` for Product Workbench and operator surfaces after V8 stabilizes
   the source/artifact/IR contract.
8. Keep closed dependency PR #326 as superseded lineage, not active release
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
