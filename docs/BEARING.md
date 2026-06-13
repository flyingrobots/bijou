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

- `DX-043`, `DX-044`, and `DX-045` landed the portable `ui-scene-ir/1` seed,
  the first GraphQL-authored `bijou-block/1` proof, grouped block authoring,
  and deterministic debug facts for #302.
- The next active pull is `DX-046`: one real DOGFOOD block or panel authored as
  GraphQL SDL, compiled to `bijou-block/1`, lowered to `ui-scene-ir/1`, and
  proven through terminal output plus debug facts. This keeps the work inside
  Bijou one more slice before Wesley or Geordi integration.
- The useful proof path is now:

  ```text
  GraphQL SDL fixture
    -> bijou-block/1 grouped artifact
      -> ui-scene-ir/1
        -> terminal Surface proof
          -> graphql-bijou-block-debug/1 facts
            -> DOGFOOD product facts
  ```

### 1. Keep The Release Posture Honest

- The latest shipped public release is `v7.0.0`, published on 2026-06-03.
- The `v6.0.0` and `v7.0.0` GitHub milestone lanes are complete release
  lineage with zero open items, not the next implementation target.
- The next selected public release target is `v7.1.0`: a small post-V7 minor
  release for accumulated `Unreleased` work plus DX-046 as the final planned
  implementation pull.
- There is no planned `v7.2.0` feature train. After `v7.1.0`, new feature work
  should shape toward `v8.0.0` unless maintenance pressure requires a narrow
  patch or stabilization release.
- The detailed release-horizon index lives in [ROADMAP.md](./ROADMAP.md), and
  the release process lives in [release.md](./release.md).

### 2. GitHub Issues Are The Work Tracker

- GitHub Issues and milestones are now the canonical queue.
- `docs/method/backlog/` is evidence and lineage, not the primary planning UI.
- `ROADMAP.md` is the human-readable mirror of milestone triage, not an
  independent source of truth.
- Any issue moved between `v6.0.0`, `v7.0.0`, and `Beyond` should get a GitHub
  comment and a matching roadmap update.

### 3. Shape V8 And V9 From Beyond

- The `Beyond` milestone is the current post-v7 backlog: 33 open and 4 closed
  milestone items as of the latest roadmap sync.
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

- **Closed Release Gravity**: `v6.0.0` and `v7.0.0` are complete release
  lineage. Do not use either lane for new feature work.
- **Minor-Release Temptation**: `v7.1.0` should stay small. Adding a full
  workbench, theme lab, localization suite, Wesley path, or Geordi path turns it
  into V8/V9 work.
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

The immediate feature focus is `DX-046`: a GraphQL-authored DOGFOOD block
fixture for #302. This is a post-v7 proof slice, not a `v6.0.0` or `v7.0.0`
release-readiness task.

DX-046 is also the final planned implementation pull for `v7.1.0`. After it
lands, the repo should move into release prep unless the open dependency PR is
green and low-risk enough to include.

The `DX-046` validation pass must prove:

- one existing DOGFOOD block or panel has a checked-in GraphQL SDL source
- that SDL compiles into a deterministic grouped `bijou-block/1` artifact
- the artifact lowers into valid `ui-scene-ir/1`
- terminal proof preserves source maps, tokens, i18n keys, actions, bindings,
  lower modes, receipt hashes, and `graphql-bijou-block-debug/1` facts
- failure tests catch missing product facts such as invalid token refs,
  missing localization posture, duplicate ids, or broken group references

Recommended pull order:

1. Land this release-train roadmap decision.
2. Take `DX-046` GraphQL-authored DOGFOOD block fixture for #302.
3. Include dependency PR #326 only if it is green, low-risk, and still useful
   before release prep.
4. Create or update the `v7.1.0` release packet, move only selected tracker
   items into it, and cut `v7.1.0` from a clean release branch.
5. Shape `v8.0.0` around the Runtime Graph And Scene IR product contract.
6. Keep `v9.0.0` for Product Workbench and operator surfaces after V8 stabilizes
   the source/artifact/IR contract.

Non-goals for the next cycle:

- no feature-train `v7.2.0`
- no broad DOGFOOD runtime rewrite
- no full remaining component-family audit sweep from `v7.0.0`
- no full visual redesign of DOGFOOD while DX-046 is still the active proof
- no conversion of every leaf component into a Block
- no hidden global block registry
- no localization runtime rewrite
- no Wesley or Geordi repository changes before the DOGFOOD fixture proves the
  Bijou-side source, artifact, IR, and debug contracts
