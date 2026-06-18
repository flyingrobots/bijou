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

Last synced from GitHub milestone items: 2026-06-15.

## Current Release State

The latest shipped public release is
[`v7.1.0`](https://github.com/flyingrobots/bijou/releases/tag/v7.1.0),
published from the post-V7 release packet on 2026-06-14.

`v6.0.0` was never published as a public package release. Its GitHub milestone
is complete tracker lineage whose work was absorbed before Bijou shipped
`v7.0.0`; do not use that lane for new release work.

`v7.1.0` is complete post-V7 minor release lineage: accumulated `Unreleased`
work after `v7.0.0`, the landed DX-046 DOGFOOD GraphQL fixture, #270
release-readiness guardrails, #312 DOGFOOD i18n debt coverage, and the
versioned release evidence packet.

`v7.2.0` is now selected as a narrow stabilization and demo-integrity release.
It is not a broad feature train and does not replace the `v8.0.0` Runtime Graph
and Scene IR product-contract horizon. Its purpose is to repair the concrete
post-`v7.1.0` video-rehearsal and framework-input issues that make the current
V7 story harder to use, test, or demonstrate.

Before the next `v7.2.0` product pull, the active pre-release quality goalpost
is **Respectful Repo: Enter the Code Dojo**. The verbatim
[TypeScript Code Standards Editor's Edition](./typescript-code-standards.editors-edition.md)
artifact, Code Dojo hooks, CI workflow, and ratcheting baselines must be
enforceable so future stabilization work cannot add or grow standards debt. The
[Code Dojo exception ledger](./code-dojo-exceptions.md) also requires every met
goalpost to remove at least 50 counted standards violations until the aggregate
count reaches zero.

| Horizon | Milestone | Open Items | Closed Items | Current Posture |
| :--- | :--- | ---: | ---: | :--- |
| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 6 | 8 | Active stabilization lane for demo integrity, framework input correctness, and narrow security repairs. |
| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 | Latest shipped release lineage after the release PR merges. Complete; do not reopen for new feature work. |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Shipped release lineage. Complete; do not reopen for new feature work. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 31 | 6 | Active forward backlog. Promote shaped work from here into a versioned release. |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Skipped public release lane. Complete lineage retained for issue history. |

## Release Train Decision

### `v7.1.0`: Shipped Post-V7 Minor

`v7.1.0` is the current shipped public release boundary.

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
and the release PR there for history, leave parent #302 in `Beyond`, and do not
move new feature work into `v7.1.0`.

### `v7.2.0`: Stabilization And Demo Integrity

`v7.2.0` is the selected narrow repair release after the failed release-video
rehearsal. Its job is to make the existing V7 surface more honest and
demonstrable without pulling the broad V8 product contract forward.

Primary tracker:

- [#354](https://github.com/flyingrobots/bijou/issues/354) for the umbrella
  stabilization goalpost
- [#344](https://github.com/flyingrobots/bijou/issues/344),
  [#345](https://github.com/flyingrobots/bijou/issues/345), and
  [#353](https://github.com/flyingrobots/bijou/issues/353) for framework input
  correctness, public app-frame helper exports, and mouse driver builders
- [#340](https://github.com/flyingrobots/bijou/issues/340),
  [#341](https://github.com/flyingrobots/bijou/issues/341),
  [#342](https://github.com/flyingrobots/bijou/issues/342),
  [#343](https://github.com/flyingrobots/bijou/issues/343), and
  [#335](https://github.com/flyingrobots/bijou/issues/335) for DOGFOOD
  localization, light-theme, Blocks documentation, theme-variant, and
  release-story demo integrity
- [#357](https://github.com/flyingrobots/bijou/issues/357) for the urgent
  `esbuild@0.28.1` security patch reported by GitHub/npm audit
- Respectful Repo: Enter the Code Dojo as the active pre-release quality
  goalpost before the remaining DOGFOOD demo-integrity pulls

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

Primary tracker:

- [#302](https://github.com/flyingrobots/bijou/issues/302) for GraphQL-authored
  UI scenes into Bijou Blocks
- [#202](https://github.com/flyingrobots/bijou/issues/202),
  [#209](https://github.com/flyingrobots/bijou/issues/209),
  [#210](https://github.com/flyingrobots/bijou/issues/210),
  [#211](https://github.com/flyingrobots/bijou/issues/211),
  [#212](https://github.com/flyingrobots/bijou/issues/212),
  [#213](https://github.com/flyingrobots/bijou/issues/213),
  [#216](https://github.com/flyingrobots/bijou/issues/216), and
  [#219](https://github.com/flyingrobots/bijou/issues/219) for runtime graph,
  DAG, generation, and lowering pressure
- [#301](https://github.com/flyingrobots/bijou/issues/301) for native frame
  capture evidence
- triage [#306](https://github.com/flyingrobots/bijou/issues/306) into this
  release only if a playback harness becomes necessary for deterministic proof
- triage [#321](https://github.com/flyingrobots/bijou/issues/321) only if the
  fluid-triangle title screen stays Bijou-side and proves CPU/terminal
  scene-contract behavior; keep Geordi-heavy work out of the critical path

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

### `v9.0.0`: Product Workbench And Operator Surfaces

`v9.0.0` should be the major release after the V8 contract exists. Its job is to
make Bijou authoring, inspection, localization, and product review feel like a
real workbench instead of scattered fixtures.

Primary tracker:

- DOGFOOD and BlockLab: [#204](https://github.com/flyingrobots/bijou/issues/204),
  [#205](https://github.com/flyingrobots/bijou/issues/205),
  [#214](https://github.com/flyingrobots/bijou/issues/214),
  [#215](https://github.com/flyingrobots/bijou/issues/215),
  [#217](https://github.com/flyingrobots/bijou/issues/217),
  [#218](https://github.com/flyingrobots/bijou/issues/218),
  [#248](https://github.com/flyingrobots/bijou/issues/248), and
  [#272](https://github.com/flyingrobots/bijou/issues/272)
- theme and design-token workbench:
  [#311](https://github.com/flyingrobots/bijou/issues/311),
  [#315](https://github.com/flyingrobots/bijou/issues/315),
  [#317](https://github.com/flyingrobots/bijou/issues/317), and
  [#318](https://github.com/flyingrobots/bijou/issues/318)
- localization and docs operations:
  [#206](https://github.com/flyingrobots/bijou/issues/206),
  [#207](https://github.com/flyingrobots/bijou/issues/207),
  [#208](https://github.com/flyingrobots/bijou/issues/208)
- terminal input and host controls:
  [#316](https://github.com/flyingrobots/bijou/issues/316), if the transport
  contract becomes a product-control requirement rather than a standalone
  host-compatibility spike

Release gate:

- Storybook-grade BlockLab or equivalent DOGFOOD fixture workflows
- artifact matrices and capture proof that make product review reproducible
- Theme Lab and Theme Inspector provenance surfaces backed by token facts
- localization workbench and scanner coverage that make translation debt visible
- terminal input controls with playback fixtures if #316 joins the release

### `v10.0.0+`: Ecosystem Integration

Do not make Wesley, Geordi, or host-integration work the immediate post-V7
critical path. Keep those as `v10.0.0+` candidates unless the V8 contract proves
that a cross-repository release is the next smallest honest boundary.

## Next Pull

The immediate implementation pull should land the **DOGFOOD light theme
readiness** repair from #341 through DL-017.

That pull should add deterministic light-theme witnesses for settings, menu,
or modal chrome; fix any unpainted background path those witnesses reveal; tune
low-contrast light-theme token pairs used by borders, panels, muted text, and
selection rows; and expand theme diagnostics so DOGFOOD chrome contrast does
not regress silently.

## Forward Goalposts

These are planning recommendations from the open tracker state as of
2026-06-15. `v7.1.0` is shipped lineage; `v7.2.0` is the active stabilization
lane; `v8.0.0` and `v9.0.0` remain the intended feature horizons after the
stabilization release.

| Target | Goalpost | Tracker | Why It Belongs There | Release Gate |
| :--- | :--- | :--- | :--- | :--- |
| `v7.1.0` | Shipped Post-V7 Minor | Landed DX-046 [#329](https://github.com/flyingrobots/bijou/issues/329), release-prep guardrails [#270](https://github.com/flyingrobots/bijou/issues/270) and [#312](https://github.com/flyingrobots/bijou/issues/312), the v7.1.0 release PR, and `Unreleased` changelog work after `v7.0.0` | The repo shipped a meaningful post-V7 batch without turning it into a new product epoch. | Met: DX-046 green, #270/#312 green, release evidence packet written, #329 kept in `v7.1.0` without moving #302 out of `Beyond`, and no broad scope creep. |
| `v7.2.0` | Demo Integrity And Framework Input Stabilization | Active goalpost [#354](https://github.com/flyingrobots/bijou/issues/354), framework input stories [#344](https://github.com/flyingrobots/bijou/issues/344), [#345](https://github.com/flyingrobots/bijou/issues/345), [#353](https://github.com/flyingrobots/bijou/issues/353), DOGFOOD repair stories [#340](https://github.com/flyingrobots/bijou/issues/340), [#341](https://github.com/flyingrobots/bijou/issues/341), [#342](https://github.com/flyingrobots/bijou/issues/342), [#343](https://github.com/flyingrobots/bijou/issues/343), [#335](https://github.com/flyingrobots/bijou/issues/335), and security patch [#357](https://github.com/flyingrobots/bijou/issues/357). | The v7.1 proof exists, but the release-video rehearsal exposed demo-breaking seams in localization, theme posture, Blocks docs, release-story surfaces, and mouse routing; the GitHub/npm audit also reported a narrow `esbuild` development-tooling advisory. | Workspace pointer fallthrough fixed, page-frame helper exports public, mouse test helpers available, DOGFOOD demo surfaces honest enough for release video, audit clean, and release-readiness green. |
| `v8.0.0` | Runtime Graph And Scene IR Product Contract | Beyond: [#202](https://github.com/flyingrobots/bijou/issues/202), [#209](https://github.com/flyingrobots/bijou/issues/209), [#210](https://github.com/flyingrobots/bijou/issues/210), [#211](https://github.com/flyingrobots/bijou/issues/211), [#212](https://github.com/flyingrobots/bijou/issues/212), [#213](https://github.com/flyingrobots/bijou/issues/213), [#216](https://github.com/flyingrobots/bijou/issues/216), [#219](https://github.com/flyingrobots/bijou/issues/219), [#301](https://github.com/flyingrobots/bijou/issues/301), [#302](https://github.com/flyingrobots/bijou/issues/302). Triage: [#306](https://github.com/flyingrobots/bijou/issues/306), [#321](https://github.com/flyingrobots/bijou/issues/321). | This is the current product direction after DX-043 through DX-046: portable scenes, GraphQL blocks, deterministic debug facts, and product fixtures need to become a stable contract. | Stable artifact semantics, DOGFOOD round-trip fixtures, terminal/frame-capture proof, lower-mode and source-map receipts, and failure tests. |
| `v9.0.0` | Product Workbench And Operator Surfaces | Beyond: [#204](https://github.com/flyingrobots/bijou/issues/204), [#205](https://github.com/flyingrobots/bijou/issues/205), [#206](https://github.com/flyingrobots/bijou/issues/206), [#207](https://github.com/flyingrobots/bijou/issues/207), [#208](https://github.com/flyingrobots/bijou/issues/208), [#214](https://github.com/flyingrobots/bijou/issues/214), [#215](https://github.com/flyingrobots/bijou/issues/215), [#217](https://github.com/flyingrobots/bijou/issues/217), [#218](https://github.com/flyingrobots/bijou/issues/218), [#248](https://github.com/flyingrobots/bijou/issues/248), [#272](https://github.com/flyingrobots/bijou/issues/272), [#311](https://github.com/flyingrobots/bijou/issues/311), [#315](https://github.com/flyingrobots/bijou/issues/315), [#318](https://github.com/flyingrobots/bijou/issues/318). Triage: [#317](https://github.com/flyingrobots/bijou/issues/317), [#316](https://github.com/flyingrobots/bijou/issues/316). | Once V8 stabilizes the artifact contract, the next value is authoring and inspecting real product surfaces: BlockLab, Theme Lab, localization operations, artifact matrices, and host controls. | Storybook-grade BlockLab workflows, Theme Inspector/Lab provenance, localization workbench proof, artifact matrices, and playback-backed terminal input where applicable. |
| `v10.0.0+` | Ecosystem Integration | Wesley, Geordi, and host integration follow-on work after V8/V9 shape the contracts | Cross-repository integration should consume proven Bijou contracts rather than define them under release pressure. | A cross-repo release packet with explicit dependency ordering, proof artifacts, and rollback boundaries. |

## Decision Points

- **Current release**: `v7.1.0` is shipped post-V7 minor lineage. The broad #302
  tracker stays in `Beyond` for `v8.0.0`; `v7.1.0` owns #329 as closed DX-046
  lineage plus #270 and #312 as release-prep guardrails.
- **Next release**: `v7.2.0` is the active narrow stabilization release. It
  should fix demo-integrity and framework-input seams without becoming the next
  feature train.
- **Next feature version**: `v8.0.0` is still the next intended feature horizon.
- **V7.2 boundary**: do not pull broad Runtime Graph, BlockLab, Theme Lab,
  localization workbench, worker rendering, adaptive frame budgeting, or
  raster-surface APIs into `v7.2.0` unless a maintainer deliberately reshapes
  the milestone. Narrow security repairs may ride the release.
- **V8 boundary**: Runtime Graph And Scene IR becomes the next major only when
  the artifact, IR, receipt, source-map, lower-mode, debug, and capture
  contracts are product-grade.
- **V9 boundary**: Product Workbench And Operator Surfaces should wait until V8
  makes the source/artifact/IR contract stable enough to inspect and author
  against.
- **DX-046 boundary**: Bijou-side only. Wesley and Geordi remain out of the
  critical path until DOGFOOD proves the artifact contracts.
- **Tracker hygiene**: unmilestoned issues with `roadmap`, `work-in-progress`,
  `needs-design`, or `needs-playback` labels should be explicitly triaged before
  agents treat them as release work.
- **Release evidence**: each version still needs a release packet, GitHub
  milestone or equivalent tracker grouping, proof gates, and release evidence
  before tagging.

## Open Beyond Issues

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#336](https://github.com/flyingrobots/bijou/issues/336) | `lane:cool-ideas` | `type:enhancement` | DOGFOOD future affordances: theme hotkey, tab badges, tutorial, and achievements |
| [#202](https://github.com/flyingrobots/bijou/issues/202) | `lane:cool-ideas` | `type:enhancement` | CI-001 mermaidSurface component |
| [#203](https://github.com/flyingrobots/bijou/issues/203) | `lane:cool-ideas` | `type:spike` | CI-002 deterministic time-travel debugger |
| [#204](https://github.com/flyingrobots/bijou/issues/204) | `lane:inbox` / `lane:cool-ideas` | `type:enhancement` / `type:docs` | DX-027 choose-your-lane starter for README and DOGFOOD |
| [#205](https://github.com/flyingrobots/bijou/issues/205) | `lane:cool-ideas` | `type:enhancement` | HT-009 file explorer surface |
| [#206](https://github.com/flyingrobots/bijou/issues/206) | `lane:cool-ideas` | `type:enhancement` | LX-015 DOGFOOD localization burndown dashboard |
| [#207](https://github.com/flyingrobots/bijou/issues/207) | `lane:cool-ideas` | `type:enhancement` | LX-016 portable locale preferences across hosts |
| [#208](https://github.com/flyingrobots/bijou/issues/208) | `lane:cool-ideas` | `type:enhancement` | LX-017 multilingual DOGFOOD translation workbench |
| [#209](https://github.com/flyingrobots/bijou/issues/209) | `lane:cool-ideas` | `type:enhancement` | RE-025 DAG path emphasis |
| [#210](https://github.com/flyingrobots/bijou/issues/210) | `lane:cool-ideas` | `type:enhancement` | RE-026 DAG edge labels |
| [#211](https://github.com/flyingrobots/bijou/issues/211) | `lane:cool-ideas` | `type:enhancement` | RE-027 DAG compact legend mode |
| [#212](https://github.com/flyingrobots/bijou/issues/212) | `lane:cool-ideas` | `type:enhancement` | RE-028 DAG edge semantics and metadata |
| [#213](https://github.com/flyingrobots/bijou/issues/213) | `lane:cool-ideas` | `type:enhancement` | RE-029 DAG adaptive density and lowering |
| [#214](https://github.com/flyingrobots/bijou/issues/214) | `lane:cool-ideas` / `lane:up-next` | `type:enhancement` / `type:spike` | BigBro audit tool |
| [#215](https://github.com/flyingrobots/bijou/issues/215) | `lane:cool-ideas` | `type:docs` / `type:spike` | Terminal shader extensions |
| [#216](https://github.com/flyingrobots/bijou/issues/216) | `lane:cool-ideas` / `lane:up-next` | `type:enhancement` / `type:spike` | MCP-driven UI generation |
| [#217](https://github.com/flyingrobots/bijou/issues/217) | `lane:cool-ideas` / `lane:up-next` | `type:enhancement` | bijou-fix-rhythm CLI |
| [#218](https://github.com/flyingrobots/bijou/issues/218) | `lane:cool-ideas` / `lane:up-next` | `type:enhancement` / `type:maintenance` | Semantic list component |
| [#219](https://github.com/flyingrobots/bijou/issues/219) | `lane:inbox` | `type:enhancement` | RE-027 generalize crash-mode auto-exit beyond TTY detection |
| [#248](https://github.com/flyingrobots/bijou/issues/248) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Capture artifacts as first-class docs artifact matrix |
| [#268](https://github.com/flyingrobots/bijou/issues/268) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Method tracker-sync sentinel for GitHub milestones |
| [#272](https://github.com/flyingrobots/bijou/issues/272) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | BlockLab toward Storybook-grade product workflows |
| [#290](https://github.com/flyingrobots/bijou/issues/290) | `lane:cool-ideas` | `type:enhancement` / `type:docs` / `type:maintenance` | Method cycle artifact manifest |
| [#298](https://github.com/flyingrobots/bijou/issues/298) | `lane:bad-code` | `type:maintenance` | Fixture-backed DOGFOOD view harness |
| [#299](https://github.com/flyingrobots/bijou/issues/299) | `lane:bad-code` | `type:maintenance` | Split smoke gates from real PTY and subprocess dependencies |
| [#300](https://github.com/flyingrobots/bijou/issues/300) | `lane:bad-code` | `type:maintenance` | Inject git and GitHub clients into policy scripts |
| [#301](https://github.com/flyingrobots/bijou/issues/301) | `lane:cool-ideas` | `type:enhancement` / `type:maintenance` | Native Bijou frame-capture format |
| [#302](https://github.com/flyingrobots/bijou/issues/302) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Compile GraphQL-authored UI scenes into Bijou Blocks |
| [#311](https://github.com/flyingrobots/bijou/issues/311) | `lane:cool-ideas` | `type:enhancement` | DL-014 theme inspector drawer |
| [#315](https://github.com/flyingrobots/bijou/issues/315) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | DOGFOOD theme lab and preset gallery |
| [#318](https://github.com/flyingrobots/bijou/issues/318) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Rampensau-inspired Bijou theme generator |

## Open Unmilestoned Triage

These issues are open but not assigned to a release horizon. Move them into
`Beyond` or a versioned release only after shaping.

| Issue | Lane | Type | Recommendation |
| :--- | :--- | :--- | :--- |
| [#352](https://github.com/flyingrobots/bijou/issues/352) | `lane:asap` | `type:enhancement` | Candidate for a later small DX polish pull only if color helpers remain additive; otherwise shape for `v9.0.0` design-system work. |
| [#351](https://github.com/flyingrobots/bijou/issues/351) | `lane:cool-ideas` | `type:enhancement` | Shape before assigning; likely post-V8 frame-budget work, not part of `v7.2.0`. |
| [#350](https://github.com/flyingrobots/bijou/issues/350) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Shape before assigning; worker-pool rendering is too broad for the v7.2 stabilization lane. |
| [#349](https://github.com/flyingrobots/bijou/issues/349) | `lane:cool-ideas` | `type:enhancement` | Shape before assigning; pane-level mouse masks may follow #344 but should not block `v7.2.0`. |
| [#348](https://github.com/flyingrobots/bijou/issues/348) | `lane:asap` | `type:enhancement` | Candidate for a later narrow performance pull only if it stays allocation-free and additive. |
| [#347](https://github.com/flyingrobots/bijou/issues/347) | `lane:cool-ideas` | `type:maintenance` | Shape as a larger layout/testability refactor before assigning to a release horizon. |
| [#346](https://github.com/flyingrobots/bijou/issues/346) | `lane:cool-ideas` | `type:enhancement` | Shape as a first-class raster API before assigning; too broad for the first v7.2 pull. |
| [#321](https://github.com/flyingrobots/bijou/issues/321) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to `v8.0.0` only if the fluid-triangle direction stays Bijou-side and proves CPU/terminal scene-contract behavior; otherwise keep it for `v10.0.0+` ecosystem integration. |
| [#317](https://github.com/flyingrobots/bijou/issues/317) | `lane:cool-ideas` | `type:enhancement` | Attach to `v9.0.0` if Theme Inspector pointer provenance becomes part of Product Workbench and operator-surface scope. |
| [#316](https://github.com/flyingrobots/bijou/issues/316) | `lane:cool-ideas` | `type:enhancement` | Shape first; attach to `v9.0.0` only if real key-state transport becomes product-control scope for the workbench. |
| [#306](https://github.com/flyingrobots/bijou/issues/306) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to `v8.0.0` only if a playback harness becomes necessary for Runtime Graph and Scene IR proof; otherwise keep it in `Beyond` as separate workflow hardening. |
| [#249](https://github.com/flyingrobots/bijou/issues/249) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Attach to `v9.0.0` only if the technical teardown gate becomes part of reproducible product-review or artifact-matrix workflow. |

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
