# ROADMAP

This roadmap is the forward-looking release horizon for Bijou.

GitHub milestones, issues, pull requests, and labels are the live tracker. This
file is the human-readable planning surface: it names the current release
posture, the selected forward release train, the next active pull, candidate
goalposts, open tracker queues, and the decision points that turn `Beyond` work
into a versioned release.

Release snapshot counts are GitHub milestone item totals: issues and pull
requests assigned to each milestone. They are not issue-only totals. Do not
compare release snapshot item totals to issue-only `gh issue list` output
without also accounting for milestone pull requests.

Last synced from GitHub milestone items: 2026-07-28.

## Current Release State

The latest shipped public release is
[`v7.2.0`](https://github.com/flyingrobots/bijou/releases/tag/v7.2.0),
published from the demo-integrity release packet on 2026-07-05.

`v6.0.0` was never published as a public package release. Its GitHub milestone
is complete tracker lineage whose work was absorbed before Bijou shipped
`v7.0.0`; do not use that lane for new release work.

`v7.1.0` is complete post-V7 minor release lineage: accumulated work after
`v7.0.0`, the landed DX-046 DOGFOOD GraphQL fixture, #270 release-readiness
guardrails, #312 DOGFOOD i18n debt coverage, and the versioned release
evidence packet.

`v7.2.0` is complete narrow stabilization and demo-integrity release lineage.
It did not become a broad feature train and does not replace the `v8.0.0`
Runtime Graph and Scene IR product-contract horizon. Its purpose was to repair
the concrete post-`v7.1.0` video-rehearsal and framework-input issues that made
the V7 story harder to use, test, or demonstrate.

The **Respectful Repo: Enter the Code Dojo** pre-release quality goalpost has
landed. The verbatim
[TypeScript Code Standards Editor's Edition](./typescript-code-standards.editors-edition.md)
artifact, Code Dojo hooks, CI workflow, and ratcheting baselines are now
enforceable so future stabilization work cannot add or grow standards debt. The
[Code Dojo exception ledger](./code-dojo-exceptions.md) still requires every met
goalpost to remove at least 50 counted standards violations until the aggregate
count reaches zero.

| Horizon | Milestone | Open Items | Closed Items | Current Posture |
| :--- | :--- | ---: | ---: | :--- |
| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 0 | 19 | Shipped demo-integrity and framework-input stabilization lineage. |
| `v8.0.0` | [v8.0.0](https://github.com/flyingrobots/bijou/milestone/6) | 3 | 1 | Active VISOR and Runtime Graph / Scene IR contract horizon. |
| `v8.1.0` | [v8.1.0](https://github.com/flyingrobots/bijou/milestone/7) | 13 | 0 | Post-V8 replay, capture, debugger, and render-witness follow-through. |
| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 14 | 0 | Quality automation, Method hardening, and Code Dojo visibility horizon. |
| `v9.0.0` | [v9.0.0](https://github.com/flyingrobots/bijou/milestone/9) | 20 | 0 | Product Workbench and operator-surface horizon. |
| `v10.0.0` | [v10.0.0](https://github.com/flyingrobots/bijou/milestone/10) | 10 | 0 | Renderer and host-systems integration horizon. |
| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 | Previous shipped release lineage. Complete; do not reopen for new feature work. |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Shipped release lineage. Complete; do not reopen for new feature work. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 0 | 6 | Parking lane for deliberately uncommitted work; no open active backlog remains here. |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Skipped public release lane. Complete lineage retained for issue history. |

## Release Train Decision

### `v7.1.0`: Previous Shipped Post-V7 Minor

`v7.1.0` is the previous shipped public release boundary.

Shipped scope:

- `Unreleased` work after `v7.0.0`, including the portable
  `ui-scene-ir/1` seed, GraphQL-authored `bijou-block/1` compiler slices,
  grouped block authoring, `graphql-bijou-block-debug/1` facts, theme-token and
  mode-aware shell-theme foundations, raster/image glyph work, release-policy
  hardening, and roadmap truth updates
- landed DX-046 [#329](https://github.com/flyingrobots/bijou/issues/329): one real
  DOGFOOD block or panel authored as GraphQL SDL, compiled to `bijou-block/1`,
  lowered to `ui-scene-ir/1`, proven in terminal output, and summarized through
  debug facts
- release-readiness and DOGFOOD guardrails:
  [#270](https://github.com/flyingrobots/bijou/issues/270) for a
  milestone-aware readiness report, and
  [#312](https://github.com/flyingrobots/bijou/issues/312) for default
  DOGFOOD i18n debt coverage across new docs modules
- dependency PR [#326](https://github.com/flyingrobots/bijou/pull/326) was not
  selected for `v7.1.0`; it was later closed and superseded by issue-backed
  `v7.2.0` security patch [#357](https://github.com/flyingrobots/bijou/issues/357)

Non-scope:

- no broad DOGFOOD runtime rewrite
- no Wesley or Geordi repository dependency on the critical path
- no full Theme Lab, BlockLab, localization workbench, or terminal-input product
  surface
- no new major API churn beyond what was represented in the release-boundary
  changelog

The `v7.1.0` GitHub milestone is closed release lineage. Keep #329, #270, #312,
and the release PR there for history, keep parent #302 in the active `v8.0.0`
Runtime Graph horizon, and do not move new feature work into `v7.1.0`.

### `v7.2.0`: Shipped Stabilization And Demo Integrity

`v7.2.0` is the shipped narrow repair release after the failed release-video
rehearsal. It made the existing V7 surface more honest and demonstrable without
pulling the broad V8 product contract forward.

Primary tracker:

- [#354](https://github.com/flyingrobots/bijou/issues/354) for the umbrella
  stabilization goalpost
- [#344](https://github.com/flyingrobots/bijou/issues/344),
  [#345](https://github.com/flyingrobots/bijou/issues/345), and
  [#353](https://github.com/flyingrobots/bijou/issues/353) for framework input
  correctness, public app-frame helper exports, and mouse driver builders
- [#340](https://github.com/flyingrobots/bijou/issues/340),
  [#341](https://github.com/flyingrobots/bijou/issues/341),
  [#342](https://github.com/flyingrobots/bijou/issues/342), and
  [#343](https://github.com/flyingrobots/bijou/issues/343) are landed DOGFOOD
  localization, light-theme, Blocks documentation, and theme-variant
  demo-integrity lineage
- [#335](https://github.com/flyingrobots/bijou/issues/335) is the landed
  DOGFOOD release-story surface pull for keeping What's New, the real GraphQL
  proof chain, and changelog boundaries in the main DOGFOOD reader flow
- [#357](https://github.com/flyingrobots/bijou/issues/357) for the urgent
  `esbuild@0.28.1` security patch reported by GitHub/npm audit
- Respectful Repo: Enter the Code Dojo as landed pre-release quality lineage

Release gate:

- Code Dojo file/context, core-purity, mock-ban, Graft receipt, code-size,
  typecheck, lint, and deterministic test gates are enforceable with ratcheting
  baselines for current debt.
- `npm run code-dojo:debt` reports the aggregate standards-debt count and every
  met goalpost lowers that count by at least 50 until zero.
- no swallowed workspace mouse movement, release, or non-left press events
- root-exported page-scoped app-frame helpers
- reusable scripted mouse driver helpers and focused pointer regressions
- demo-ready or explicitly honest DOGFOOD localization, light-theme, Blocks,
  theme-variant, What's New, GraphQL proof, and changelog surfaces
- normal release-readiness evidence before tagging

### `v8.0.0`: Runtime Graph And Scene IR Product Contract

`v8.0.0` should be the next major release. Its job is to turn the portable scene
and GraphQL block proof into a product contract, not just a compiler demo.

Primary staged milestone trackers:

- [#457](https://github.com/flyingrobots/bijou/issues/457) TRACKER: VISOR
  warpspace for v8 Runtime Graph And Scene IR
- [#458](https://github.com/flyingrobots/bijou/issues/458) VISOR: emit GraphQL
  block artifact bundle with replay and visual scene facts, shaped by
  [`DX-049`](./design/DX-049-visor-artifact-bundle-proof.md) as the first
  `visor-artifact-bundle/1` proof
- [#459](https://github.com/flyingrobots/bijou/issues/459) VISOR: validate
  packed-bijou-cells/1 and adapt to Surface
- [#302](https://github.com/flyingrobots/bijou/issues/302) as the broad
  GraphQL-authored UI scenes into Bijou Blocks source tracker

Release gate:

- versioned artifact semantics for `bijou-block/1`, `ui-scene-ir/1`, receipts,
  source maps, lower modes, and debug facts
- one or more DOGFOOD fixtures that round-trip from source to artifact to IR to
  terminal proof with stable hashes
- deterministic frame-capture or playback evidence reviewers can inspect
- failure tests for invalid references, duplicate identities, missing product
  facts, and broken lowering assumptions
- an explicit Wesley/Geordi boundary note, without requiring those repositories
  to ship first

### `v8.1.0`: Replay, Capture, And Render Witnesses

`v8.1.0` should harden the proof machinery that follows the first V8 contract
boundary. Its job is to make replay, frame capture, visual facts, debugger
fixtures, and graph witnesses reliable enough for later workbench and renderer
surfaces to consume.

Primary tracker:

- replay and capture proof:
  [#456](https://github.com/flyingrobots/bijou/issues/456),
  [#306](https://github.com/flyingrobots/bijou/issues/306),
  [#301](https://github.com/flyingrobots/bijou/issues/301), and
  [#203](https://github.com/flyingrobots/bijou/issues/203)
- debugger and render witness follow-through:
  [#441](https://github.com/flyingrobots/bijou/issues/441),
  [#442](https://github.com/flyingrobots/bijou/issues/442), and
  [#443](https://github.com/flyingrobots/bijou/issues/443)
- Runtime Graph and DAG visualization:
  [#202](https://github.com/flyingrobots/bijou/issues/202),
  [#209](https://github.com/flyingrobots/bijou/issues/209),
  [#210](https://github.com/flyingrobots/bijou/issues/210),
  [#211](https://github.com/flyingrobots/bijou/issues/211),
  [#212](https://github.com/flyingrobots/bijou/issues/212), and
  [#213](https://github.com/flyingrobots/bijou/issues/213)

Release gate:

- deterministic replay and frame-capture fixtures with stable artifact hashes
- debugger fixtures that can prove the artifact/IR/runtime boundary without
  depending on live terminal timing
- graph visualization surfaces that consume Runtime Graph facts rather than
  reinterpreting source data ad hoc

### `v8.2.0`: Quality Automation And Method Hardening

`v8.2.0` should make the repo's quality system easier to see, enforce, and
iterate. Its job is to keep Code Dojo and Method gates fast enough for daily
work while preserving the no-debt-growth release posture.

Primary tracker:

- Code Dojo visibility and ratchet automation:
  [#469](https://github.com/flyingrobots/bijou/issues/469),
  [#373](https://github.com/flyingrobots/bijou/issues/373),
  [#372](https://github.com/flyingrobots/bijou/issues/372),
  [#371](https://github.com/flyingrobots/bijou/issues/371), and
  [#369](https://github.com/flyingrobots/bijou/issues/369)
- Method, tracker, and CI seam hardening:
  [#376](https://github.com/flyingrobots/bijou/issues/376),
  [#300](https://github.com/flyingrobots/bijou/issues/300),
  [#299](https://github.com/flyingrobots/bijou/issues/299),
  [#290](https://github.com/flyingrobots/bijou/issues/290),
  [#268](https://github.com/flyingrobots/bijou/issues/268), and
  [#249](https://github.com/flyingrobots/bijou/issues/249)
- fixture and typing repairs:
  [#368](https://github.com/flyingrobots/bijou/issues/368),
  [#367](https://github.com/flyingrobots/bijou/issues/367), and
  [#298](https://github.com/flyingrobots/bijou/issues/298)

Release gate:

- pull-request visible Code Dojo deltas that do not hide live slack under stale
  ceilings
- Method tracker synchronization that prevents milestone drift from silently
  returning
- typed DOGFOOD and docs-preview fixtures that reduce brittle smoke-test
  coupling

### `v9.0.0`: Product Workbench And Operator Surfaces

`v9.0.0` should be the major release after the V8 contract exists. Its job is to
make Bijou authoring, inspection, localization, and product review feel like a
real workbench instead of scattered fixtures.

Primary tracker:

- DOGFOOD and BlockLab: [#455](https://github.com/flyingrobots/bijou/issues/455),
  [#336](https://github.com/flyingrobots/bijou/issues/336),
  [#204](https://github.com/flyingrobots/bijou/issues/204),
  [#205](https://github.com/flyingrobots/bijou/issues/205),
  [#214](https://github.com/flyingrobots/bijou/issues/214),
  [#216](https://github.com/flyingrobots/bijou/issues/216),
  [#217](https://github.com/flyingrobots/bijou/issues/217),
  [#218](https://github.com/flyingrobots/bijou/issues/218),
  [#248](https://github.com/flyingrobots/bijou/issues/248), and
  [#272](https://github.com/flyingrobots/bijou/issues/272)
- theme and design-token workbench:
  [#352](https://github.com/flyingrobots/bijou/issues/352),
  [#347](https://github.com/flyingrobots/bijou/issues/347),
  [#311](https://github.com/flyingrobots/bijou/issues/311),
  [#315](https://github.com/flyingrobots/bijou/issues/315),
  [#317](https://github.com/flyingrobots/bijou/issues/317), and
  [#318](https://github.com/flyingrobots/bijou/issues/318)
- localization and docs operations:
  [#454](https://github.com/flyingrobots/bijou/issues/454),
  [#206](https://github.com/flyingrobots/bijou/issues/206),
  [#207](https://github.com/flyingrobots/bijou/issues/207),
  [#208](https://github.com/flyingrobots/bijou/issues/208)

Release gate:

- Storybook-grade BlockLab or equivalent DOGFOOD fixture workflows
- artifact matrices and capture proof that make product review reproducible
- Theme Lab and Theme Inspector provenance surfaces backed by token facts
- localization workbench and scanner coverage that make translation debt visible
- structured changelog and product-review docs that reduce release-flow and
  i18n burden

### `v10.0.0`: Renderer And Host Systems Integration

Do not make Wesley, Geordi, or host-integration work the immediate post-V7
critical path. Keep those as `v10.0.0` candidates unless the V8 and V9
contracts prove that a cross-repository release is the next smallest honest
boundary.

Primary tracker:

- Geordi/Wesley and title-screen renderer follow-through:
  [#468](https://github.com/flyingrobots/bijou/issues/468),
  [#321](https://github.com/flyingrobots/bijou/issues/321),
  [#351](https://github.com/flyingrobots/bijou/issues/351),
  [#350](https://github.com/flyingrobots/bijou/issues/350), and
  [#219](https://github.com/flyingrobots/bijou/issues/219)
- terminal shader, raster, and native-render foundations:
  [#348](https://github.com/flyingrobots/bijou/issues/348),
  [#346](https://github.com/flyingrobots/bijou/issues/346), and
  [#215](https://github.com/flyingrobots/bijou/issues/215)
- host input and pane-control scope:
  [#349](https://github.com/flyingrobots/bijou/issues/349) and
  [#316](https://github.com/flyingrobots/bijou/issues/316)

## Next Pull

The Code Dojo prerequisite
[#469](https://github.com/flyingrobots/bijou/issues/469) has met its `112`
aggregate-debt contract. The next repository pull is
[#468](https://github.com/flyingrobots/bijou/issues/468), which consumes the
canonical website specimen and proves one
Bijou-owned `ui-scene-ir/1`, layout, `Surface`, source-map, and receipt path.
The active V8 product sequence remains #458 followed by #459; it resumes after
the bounded target proof instead of being redefined by it.

## Forward Goalposts

These are planning recommendations from the open tracker state as of
2026-07-05. `v7.1.0` and `v7.2.0` are shipped lineage; `v8.0.0`, `v8.1.0`,
`v8.2.0`, `v9.0.0`, and `v10.0.0` are the explicit forward release horizons.

| Target | Goalpost | Tracker | Why It Belongs There | Release Gate |
| :--- | :--- | :--- | :--- | :--- |
| `v7.1.0` | Shipped Post-V7 Minor | Landed DX-046 [#329](https://github.com/flyingrobots/bijou/issues/329), release-prep guardrails [#270](https://github.com/flyingrobots/bijou/issues/270) and [#312](https://github.com/flyingrobots/bijou/issues/312), the v7.1.0 release PR, and `Unreleased` changelog work after `v7.0.0` | The repo shipped a meaningful post-V7 batch without turning it into a new product epoch. | Met: DX-046 green, #270/#312 green, release evidence packet written, #329 kept in `v7.1.0` without pulling #302 backward, and no broad scope creep. |
| `v7.2.0` | Demo Integrity And Framework Input Stabilization | Release-gate goalpost [#354](https://github.com/flyingrobots/bijou/issues/354), framework input stories [#344](https://github.com/flyingrobots/bijou/issues/344), [#345](https://github.com/flyingrobots/bijou/issues/345), [#353](https://github.com/flyingrobots/bijou/issues/353), landed DOGFOOD repair stories [#340](https://github.com/flyingrobots/bijou/issues/340), [#341](https://github.com/flyingrobots/bijou/issues/341), [#342](https://github.com/flyingrobots/bijou/issues/342), [#343](https://github.com/flyingrobots/bijou/issues/343), landed release-story story [#335](https://github.com/flyingrobots/bijou/issues/335), and security patches [#357](https://github.com/flyingrobots/bijou/issues/357), [#370](https://github.com/flyingrobots/bijou/issues/370). | The v7.1 proof exists, but the release-video rehearsal exposed demo-breaking seams in localization, theme posture, Blocks docs, release-story surfaces, and mouse routing; GitHub/npm audit also reported narrow development-tooling and dependency advisories that are now triaged clean. | Workspace pointer fallthrough fixed, page-frame helper exports public, mouse test helpers available, DOGFOOD demo surfaces honest enough for release video, audit clean, #335 release-story surfaces implemented, and release-readiness green. |
| `v8.0.0` | Runtime Graph And Scene IR Product Contract | Staged milestone tracker [#457](https://github.com/flyingrobots/bijou/issues/457), landed design packet [`DX-048`](./design/DX-048-v8-runtime-graph-scene-ir-contract.md), VISOR artifact bundle [#458](https://github.com/flyingrobots/bijou/issues/458), packed Bijou cell adapter [#459](https://github.com/flyingrobots/bijou/issues/459), and parent tracker [#302](https://github.com/flyingrobots/bijou/issues/302). | This is the current product direction after DX-043 through DX-046 and the VISOR planning turn: portable scenes, GraphQL blocks, deterministic debug facts, packed terminal cells, replay/capture evidence, and product fixtures need to become a stable contract. | Stable artifact semantics, DOGFOOD round-trip fixtures, terminal/frame-capture proof, lower-mode and source-map receipts, and failure tests. |
| `v8.1.0` | Replay, Capture, And Render Witnesses | [#456](https://github.com/flyingrobots/bijou/issues/456), [#443](https://github.com/flyingrobots/bijou/issues/443), [#442](https://github.com/flyingrobots/bijou/issues/442), [#441](https://github.com/flyingrobots/bijou/issues/441), [#306](https://github.com/flyingrobots/bijou/issues/306), [#301](https://github.com/flyingrobots/bijou/issues/301), [#203](https://github.com/flyingrobots/bijou/issues/203), [#202](https://github.com/flyingrobots/bijou/issues/202), and [#209](https://github.com/flyingrobots/bijou/issues/209)-[#213](https://github.com/flyingrobots/bijou/issues/213). | Once V8 defines the contract, replay, capture, debugger, and graph witnesses become the next proof surface. | Deterministic replay/capture fixtures, stable hashes, debugger facts, and graph visualizations that consume Runtime Graph facts. |
| `v8.2.0` | Quality Automation And Method Hardening | [#469](https://github.com/flyingrobots/bijou/issues/469), [#376](https://github.com/flyingrobots/bijou/issues/376), [#373](https://github.com/flyingrobots/bijou/issues/373), [#372](https://github.com/flyingrobots/bijou/issues/372), [#371](https://github.com/flyingrobots/bijou/issues/371), [#369](https://github.com/flyingrobots/bijou/issues/369), [#368](https://github.com/flyingrobots/bijou/issues/368), [#367](https://github.com/flyingrobots/bijou/issues/367), [#300](https://github.com/flyingrobots/bijou/issues/300), [#299](https://github.com/flyingrobots/bijou/issues/299), [#298](https://github.com/flyingrobots/bijou/issues/298), [#290](https://github.com/flyingrobots/bijou/issues/290), [#268](https://github.com/flyingrobots/bijou/issues/268), and [#249](https://github.com/flyingrobots/bijou/issues/249). | Quality gates now exist; this release should make them faster, more visible, and harder to drift. | PR-visible Code Dojo deltas, tracker synchronization, fixture-backed tests, typed helpers, and honest CI seams. |
| `v9.0.0` | Product Workbench And Operator Surfaces | [#455](https://github.com/flyingrobots/bijou/issues/455), [#454](https://github.com/flyingrobots/bijou/issues/454), [#352](https://github.com/flyingrobots/bijou/issues/352), [#347](https://github.com/flyingrobots/bijou/issues/347), [#336](https://github.com/flyingrobots/bijou/issues/336), [#318](https://github.com/flyingrobots/bijou/issues/318), [#317](https://github.com/flyingrobots/bijou/issues/317), [#315](https://github.com/flyingrobots/bijou/issues/315), [#311](https://github.com/flyingrobots/bijou/issues/311), [#272](https://github.com/flyingrobots/bijou/issues/272), [#248](https://github.com/flyingrobots/bijou/issues/248), [#218](https://github.com/flyingrobots/bijou/issues/218), [#217](https://github.com/flyingrobots/bijou/issues/217), [#216](https://github.com/flyingrobots/bijou/issues/216), [#214](https://github.com/flyingrobots/bijou/issues/214), [#208](https://github.com/flyingrobots/bijou/issues/208), [#207](https://github.com/flyingrobots/bijou/issues/207), [#206](https://github.com/flyingrobots/bijou/issues/206), [#205](https://github.com/flyingrobots/bijou/issues/205), and [#204](https://github.com/flyingrobots/bijou/issues/204). | Once V8 stabilizes the artifact contract, the next value is authoring and inspecting real product surfaces: BlockLab, Theme Lab, localization operations, artifact matrices, and docs/product review. | Storybook-grade BlockLab workflows, Theme Inspector/Lab provenance, localization workbench proof, artifact matrices, and structured release docs. |
| `v10.0.0` | Renderer And Host Systems Integration | [#468](https://github.com/flyingrobots/bijou/issues/468), [#321](https://github.com/flyingrobots/bijou/issues/321), [#351](https://github.com/flyingrobots/bijou/issues/351), [#350](https://github.com/flyingrobots/bijou/issues/350), [#349](https://github.com/flyingrobots/bijou/issues/349), [#348](https://github.com/flyingrobots/bijou/issues/348), [#346](https://github.com/flyingrobots/bijou/issues/346), [#316](https://github.com/flyingrobots/bijou/issues/316), [#215](https://github.com/flyingrobots/bijou/issues/215), and [#219](https://github.com/flyingrobots/bijou/issues/219). | Cross-repository integration should consume proven Bijou contracts rather than define them under release pressure. | A cross-repo release packet with explicit dependency ordering, renderer proof artifacts, terminal/native host boundaries, and rollback plans. |

## Decision Points

- **Current release**: `v7.2.0` is shipped demo-integrity and framework-input
  stabilization lineage. Stale completed work-in-progress items
  [#450](https://github.com/flyingrobots/bijou/issues/450) and
  [#383](https://github.com/flyingrobots/bijou/issues/383) were verified
  against merged implementation PRs
  [#451](https://github.com/flyingrobots/bijou/pull/451) and
  [#384](https://github.com/flyingrobots/bijou/pull/384), assigned to
  `v7.2.0`, commented, and closed as completed during the 2026-07-05 tracker
  triage.
- **Next release**: `v8.0.0` is the active feature horizon for Runtime Graph and
  Scene IR product-contract work.
- **Next feature version**: `v8.0.0` is still the next intended feature horizon.
- **V7.2 boundary**: do not pull broad Runtime Graph, BlockLab, Theme Lab,
  localization workbench, worker rendering, adaptive frame budgeting, or
  raster-surface APIs into `v7.2.0` unless a maintainer deliberately reshapes
  the milestone. Narrow security repairs may ride the release.
- **V8 boundary**: Runtime Graph And Scene IR becomes the next major only when
  the artifact, IR, receipt, source-map, lower-mode, debug, and capture
  contracts are product-grade.
- **V8.1 boundary**: replay, capture, debugger, and graph witnesses should
  prove the V8 contract; they should not reopen source/artifact semantics.
- **V8.2 boundary**: quality automation and Method hardening should improve the
  enforcement system without swallowing product-workbench scope.
- **V9 boundary**: Product Workbench And Operator Surfaces should wait until V8
  makes the source/artifact/IR contract stable enough to inspect and author
  against.
- **V10 boundary**: renderer, host, Geordi/Wesley, terminal shader, raster, and
  native-surface work should consume proven contracts from V8 and V9.
- **DX-046 boundary**: Bijou-side only. Wesley and Geordi remain out of the
  critical path until DOGFOOD proves the artifact contracts.
- **Tracker hygiene**: open issues should carry a versioned milestone unless
  they are deliberately parked in `Beyond`. Keep open unmilestoned issue
  searches empty.
- **Release evidence**: each version still needs a release packet, GitHub
  milestone or equivalent tracker grouping, proof gates, and release evidence
  before tagging.

## Open Beyond Issues

No open issue currently lives in `Beyond` after the 2026-07-05 future-release
triage. `Beyond` remains available for deliberately uncommitted work, but
active backlog issues now carry explicit version milestones.

## Open Unmilestoned Triage

No open issue is currently unmilestoned. Keep
`gh search issues --repo flyingrobots/bijou --state open --no-milestone` empty
unless a maintainer is deliberately shaping work before release assignment.

## Dependency Security Lineage

| Item | Type | Current Posture |
| :--- | :--- | :--- |
| [#357](https://github.com/flyingrobots/bijou/issues/357) / [#358](https://github.com/flyingrobots/bijou/pull/358) | dependency issue and PR | Landed `v7.2.0` security patch for `esbuild` `0.28.0` to `0.28.1`. |
| [#326](https://github.com/flyingrobots/bijou/pull/326) | dependency PR | Closed Dependabot PR for `esbuild` `0.28.0` to `0.28.1`; superseded by issue-backed #357. |

## Closed Lineage

| Horizon | Status | Notes |
| :--- | :--- | :--- |
| `v7.1.0` | Shipped public release | Portable `ui-scene-ir/1` proof, GraphQL-authored block artifacts, DOGFOOD NavigationListBlock fixture, terminal-rendering fixes, release-readiness guardrails, and DOGFOOD i18n debt coverage. Full lineage lives in the [v7.1.0 milestone](https://github.com/flyingrobots/bijou/milestone/4). |
| `v7.0.0` | Shipped public release | DOGFOOD truth, BlockLab naming, release-facing proof, scoped Node I/O documentation, release title proof, and component-family Block contracts. Full lineage lives in the [v7.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/2). |
| `v6.0.0` | Skipped public release; complete lineage | Layout truth, standard Blocks, data binding, selection/copy, and status/feedback Blocks. Full lineage lives in the [v6.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/1). |
| `Beyond closed items` | Closed backlog lineage | [#269](https://github.com/flyingrobots/bijou/issues/269), [#289](https://github.com/flyingrobots/bijou/issues/289), [#308](https://github.com/flyingrobots/bijou/issues/308), [#313](https://github.com/flyingrobots/bijou/issues/313), [#314](https://github.com/flyingrobots/bijou/issues/314), and [#334](https://github.com/flyingrobots/bijou/issues/334) are closed milestone items whose work has already landed or been resolved as not planned. |

## Maintenance Rule

Use GitHub as the source of truth:

```sh
gh api repos/flyingrobots/bijou/milestones --method GET -f state=all --paginate
gh issue list --state all --milestone v7.1.0
gh pr list --state all --search 'milestone:"v7.1.0"'
gh issue list --state all --milestone v7.2.0
gh pr list --state all --search 'milestone:"v7.2.0"'
gh issue list --state all --milestone v8.0.0
gh pr list --state all --search 'milestone:"v8.0.0"'
gh issue list --state all --milestone v8.1.0
gh pr list --state all --search 'milestone:"v8.1.0"'
gh issue list --state all --milestone v8.2.0
gh pr list --state all --search 'milestone:"v8.2.0"'
gh issue list --state all --milestone v9.0.0
gh pr list --state all --search 'milestone:"v9.0.0"'
gh issue list --state all --milestone v10.0.0
gh pr list --state all --search 'milestone:"v10.0.0"'
gh issue list --state all --milestone v7.0.0
gh pr list --state all --search 'milestone:"v7.0.0"'
gh issue list --state all --milestone Beyond
gh pr list --state all --search 'milestone:Beyond'
gh issue list --state all --milestone v6.0.0
gh pr list --state all --search 'milestone:"v6.0.0"'
gh search issues --repo flyingrobots/bijou --state open --no-milestone
gh search prs --repo flyingrobots/bijou --state open --no-milestone
```

When roadmap triage changes:

1. Move the issue or pull request to the correct GitHub milestone.
2. Preserve the issue's Method lane label unless the lane itself changes.
3. Update this document in the same commit or planning pass.
4. Leave a GitHub comment when moving work between release horizons.
