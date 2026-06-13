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

Last synced from GitHub milestone items: 2026-06-13.

## Current Release State

The latest shipped public release is
[`v7.0.0`](https://github.com/flyingrobots/bijou/releases/tag/v7.0.0),
published on 2026-06-03.

`v6.0.0` was never published as a public package release. Its GitHub milestone
is complete tracker lineage whose work was absorbed before Bijou shipped
`v7.0.0`; do not use that lane for new release work.

The next selected public release target is **`v7.1.0`**. It is a small post-V7
minor release, not a new product epoch: ship the accumulated `Unreleased` work
since `v7.0.0`, take DX-046 as the final planned implementation pull if it lands
cleanly, and then move into release prep.

There is no planned `v7.2.0` feature train. After `v7.1.0`, new feature work
should shape directly toward `v8.0.0` unless a bug, security, dependency, or
release-process reason justifies a narrow `v7.1.x` patch or emergency
`v7.2.x` stabilization release.

| Horizon | Milestone | Open Items | Closed Items | Current Posture |
| :--- | :--- | ---: | ---: | :--- |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Latest shipped release lineage. Complete; do not reopen for new feature work. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 33 | 4 | Active forward backlog. Promote shaped work from here into a versioned release. |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Skipped public release lane. Complete lineage retained for issue history. |

## Release Train Decision

### `v7.1.0`: Post-V7 Minor

`v7.1.0` is the next public release target.

Scope:

- already-landed `Unreleased` work after `v7.0.0`, including the portable
  `ui-scene-ir/1` seed, GraphQL-authored `bijou-block/1` compiler slices,
  grouped block authoring, `graphql-bijou-block-debug/1` facts, theme-token and
  mode-aware shell-theme foundations, raster/image glyph work, release-policy
  hardening, and roadmap truth updates
- DX-046: one real DOGFOOD block or panel authored as GraphQL SDL, compiled to
  `bijou-block/1`, lowered to `ui-scene-ir/1`, proven in terminal output, and
  summarized through debug facts
- dependency PR [#326](https://github.com/flyingrobots/bijou/pull/326) is a
  candidate only; it is not selected for `v7.1.0` until it is green, low-risk,
  still open before release prep, and moved into the `v7.1.0` milestone or
  release packet

Non-scope:

- no broad DOGFOOD runtime rewrite
- no Wesley or Geordi repository dependency on the critical path
- no full Theme Lab, BlockLab, localization workbench, or terminal-input product
  surface
- no new major API churn beyond what is already represented in `Unreleased`

Before release prep starts, create a `v7.1.0` GitHub milestone or release packet
and move only the selected issues and pull requests into it.

### After `v7.1.0`: Skip Feature `v7.2.0`

Plan to go directly from `v7.1.0` to `v8.0.0` for new feature development.
Use `v7.1.x` or, if semver requires it, `v7.2.x` only for bounded maintenance:
bug fixes, security fixes, dependency fixes, release-process corrections, or a
small stabilization release if `v8.0.0` slips and users need a narrow shipped
boundary.

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
  [#208](https://github.com/flyingrobots/bijou/issues/208), and
  [#312](https://github.com/flyingrobots/bijou/issues/312)
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

The immediate implementation pull is **DX-046: GraphQL-authored DOGFOOD block
fixture for #302**.

The useful proof path is:

```text
GraphQL SDL fixture
  -> bijou-block/1 grouped artifact
    -> ui-scene-ir/1
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
          -> DOGFOOD product facts
```

DX-046 should stay inside Bijou. Do not pull Wesley or Geordi into the critical
path until one real DOGFOOD block or panel proves the source, artifact, IR,
terminal, and debug contracts.

## Forward Goalposts

These are planning recommendations from the open tracker state as of
2026-06-13. `v7.1.0`, `v8.0.0`, and `v9.0.0` are the intended train, but a
maintainer still needs to create or update GitHub milestones and move issues
before those scopes become tracker-enforced release packets.

| Target | Goalpost | Tracker | Why It Belongs There | Release Gate |
| :--- | :--- | :--- | :--- | :--- |
| `v7.1.0` | Post-V7 Minor | DX-046 implementation PR or release-packet item, candidate-only [#326](https://github.com/flyingrobots/bijou/pull/326), and `Unreleased` changelog work | The repo already has a meaningful post-V7 batch. One more Bijou-side DOGFOOD fixture makes the GraphQL/IR story release-worthy without turning this into a major; the broad #302 tracker stays in `Beyond` for `v8.0.0`. | DX-046 green, release evidence packet written, selected tracker items moved to a `v7.1.0` milestone or release packet without moving #302 out of `Beyond`, and no broad scope creep. |
| `v8.0.0` | Runtime Graph And Scene IR Product Contract | Beyond: [#202](https://github.com/flyingrobots/bijou/issues/202), [#209](https://github.com/flyingrobots/bijou/issues/209), [#210](https://github.com/flyingrobots/bijou/issues/210), [#211](https://github.com/flyingrobots/bijou/issues/211), [#212](https://github.com/flyingrobots/bijou/issues/212), [#213](https://github.com/flyingrobots/bijou/issues/213), [#216](https://github.com/flyingrobots/bijou/issues/216), [#219](https://github.com/flyingrobots/bijou/issues/219), [#301](https://github.com/flyingrobots/bijou/issues/301), [#302](https://github.com/flyingrobots/bijou/issues/302). Triage: [#306](https://github.com/flyingrobots/bijou/issues/306), [#321](https://github.com/flyingrobots/bijou/issues/321). | This is the current product direction after DX-043 through DX-046: portable scenes, GraphQL blocks, deterministic debug facts, and product fixtures need to become a stable contract. | Stable artifact semantics, DOGFOOD round-trip fixtures, terminal/frame-capture proof, lower-mode and source-map receipts, and failure tests. |
| `v9.0.0` | Product Workbench And Operator Surfaces | Beyond: [#204](https://github.com/flyingrobots/bijou/issues/204), [#205](https://github.com/flyingrobots/bijou/issues/205), [#206](https://github.com/flyingrobots/bijou/issues/206), [#207](https://github.com/flyingrobots/bijou/issues/207), [#208](https://github.com/flyingrobots/bijou/issues/208), [#214](https://github.com/flyingrobots/bijou/issues/214), [#215](https://github.com/flyingrobots/bijou/issues/215), [#217](https://github.com/flyingrobots/bijou/issues/217), [#218](https://github.com/flyingrobots/bijou/issues/218), [#248](https://github.com/flyingrobots/bijou/issues/248), [#272](https://github.com/flyingrobots/bijou/issues/272), [#311](https://github.com/flyingrobots/bijou/issues/311), [#312](https://github.com/flyingrobots/bijou/issues/312), [#315](https://github.com/flyingrobots/bijou/issues/315), [#318](https://github.com/flyingrobots/bijou/issues/318). Triage: [#317](https://github.com/flyingrobots/bijou/issues/317), [#316](https://github.com/flyingrobots/bijou/issues/316). | Once V8 stabilizes the artifact contract, the next value is authoring and inspecting real product surfaces: BlockLab, Theme Lab, localization operations, artifact matrices, and host controls. | Storybook-grade BlockLab workflows, Theme Inspector/Lab provenance, localization workbench proof, artifact matrices, and playback-backed terminal input where applicable. |
| `v10.0.0+` | Ecosystem Integration | Wesley, Geordi, and host integration follow-on work after V8/V9 shape the contracts | Cross-repository integration should consume proven Bijou contracts rather than define them under release pressure. | A cross-repo release packet with explicit dependency ordering, proof artifacts, and rollback boundaries. |

## Decision Points

- **Next version**: `v7.1.0`. It is a small post-V7 minor release whose final
  planned implementation pull is DX-046. The broad #302 tracker stays in
  `Beyond` for `v8.0.0`; `v7.1.0` owns only the DX-046 implementation PR or
  release-packet item.
- **No feature `v7.2.0`**: after `v7.1.0`, go directly to `v8.0.0` for new
  feature development unless maintenance pressure forces a narrow patch or
  stabilization release.
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
| [#269](https://github.com/flyingrobots/bijou/issues/269) | `lane:bad-code` | `type:maintenance` | Review-cooldown merge sentinel |
| [#270](https://github.com/flyingrobots/bijou/issues/270) | `lane:bad-code` / `lane:release` | `type:docs` / `type:maintenance` | Release-readiness gate for issue-complete milestones |
| [#272](https://github.com/flyingrobots/bijou/issues/272) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | BlockLab toward Storybook-grade product workflows |
| [#290](https://github.com/flyingrobots/bijou/issues/290) | `lane:cool-ideas` | `type:enhancement` / `type:docs` / `type:maintenance` | Method cycle artifact manifest |
| [#298](https://github.com/flyingrobots/bijou/issues/298) | `lane:bad-code` | `type:maintenance` | Fixture-backed DOGFOOD view harness |
| [#299](https://github.com/flyingrobots/bijou/issues/299) | `lane:bad-code` | `type:maintenance` | Split smoke gates from real PTY and subprocess dependencies |
| [#300](https://github.com/flyingrobots/bijou/issues/300) | `lane:bad-code` | `type:maintenance` | Inject git and GitHub clients into policy scripts |
| [#301](https://github.com/flyingrobots/bijou/issues/301) | `lane:cool-ideas` | `type:enhancement` / `type:maintenance` | Native Bijou frame-capture format |
| [#302](https://github.com/flyingrobots/bijou/issues/302) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Compile GraphQL-authored UI scenes into Bijou Blocks |
| [#311](https://github.com/flyingrobots/bijou/issues/311) | `lane:cool-ideas` | `type:enhancement` | DL-014 theme inspector drawer |
| [#312](https://github.com/flyingrobots/bijou/issues/312) | `lane:bad-code` | `type:maintenance` | DOGFOOD i18n debt scanner misses new docs modules |
| [#315](https://github.com/flyingrobots/bijou/issues/315) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | DOGFOOD theme lab and preset gallery |
| [#318](https://github.com/flyingrobots/bijou/issues/318) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Rampensau-inspired Bijou theme generator |

## Open Unmilestoned Triage

These issues are open but not assigned to a release horizon. Move them into
`Beyond` or a versioned release only after shaping.

| Issue | Lane | Type | Recommendation |
| :--- | :--- | :--- | :--- |
| [#321](https://github.com/flyingrobots/bijou/issues/321) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to `v8.0.0` only if the fluid-triangle direction stays Bijou-side and proves CPU/terminal scene-contract behavior; otherwise keep it for `v10.0.0+` ecosystem integration. |
| [#317](https://github.com/flyingrobots/bijou/issues/317) | `lane:cool-ideas` | `type:enhancement` | Attach to `v9.0.0` if Theme Inspector pointer provenance becomes part of Product Workbench and operator-surface scope. |
| [#316](https://github.com/flyingrobots/bijou/issues/316) | `lane:cool-ideas` | `type:enhancement` | Shape first; attach to `v9.0.0` only if real key-state transport becomes product-control scope for the workbench. |
| [#306](https://github.com/flyingrobots/bijou/issues/306) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to `v8.0.0` only if a playback harness becomes necessary for Runtime Graph and Scene IR proof; otherwise keep it in `Beyond` as separate workflow hardening. |
| [#249](https://github.com/flyingrobots/bijou/issues/249) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Attach to `v9.0.0` only if the technical teardown gate becomes part of reproducible product-review or artifact-matrix workflow. |

## Open Pull Requests Outside Release Horizons

These pull requests are open and unmilestoned. They are not part of a release
horizon until GitHub metadata says so.

| PR | Type | Current Posture |
| :--- | :--- | :--- |
| [#326](https://github.com/flyingrobots/bijou/pull/326) | dependency PR | Open Dependabot PR for `esbuild` `0.28.0` to `0.28.1`; no release milestone assigned. |

## Closed Lineage

| Horizon | Status | Notes |
| :--- | :--- | :--- |
| `v7.0.0` | Shipped public release | DOGFOOD truth, BlockLab naming, release-facing proof, scoped Node I/O documentation, release title proof, and component-family Block contracts. Full lineage lives in the [v7.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/2). |
| `v6.0.0` | Skipped public release; complete lineage | Layout truth, standard Blocks, data binding, selection/copy, and status/feedback Blocks. Full lineage lives in the [v6.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/1). |
| `Beyond closed items` | Closed backlog lineage | [#289](https://github.com/flyingrobots/bijou/issues/289), [#308](https://github.com/flyingrobots/bijou/issues/308), [#313](https://github.com/flyingrobots/bijou/issues/313), and [#314](https://github.com/flyingrobots/bijou/issues/314) are closed milestone items whose work has already landed or been resolved. |

## Maintenance Rule

Use GitHub as the source of truth:

```sh
gh api repos/flyingrobots/bijou/milestones --method GET -f state=all --paginate
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
