# ROADMAP

This roadmap is the forward-looking release horizon for Bijou.

GitHub milestones, issues, pull requests, and labels are the live tracker. This
file is the human-readable planning surface: it names the current release
posture, the next active pull, candidate goalposts, open tracker queues, and the
decision points that turn `Beyond` work into a versioned release.

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
is closed tracker lineage whose work was absorbed before Bijou shipped
`v7.0.0`.

No next public release version is selected. Pick a version only after one of the
forward candidate goalposts below is shaped into a release packet with an
umbrella issue, user-story slices, proof gates, and a release evidence plan.

| Horizon | Milestone | Open Items | Closed Items | Current Posture |
| :--- | :--- | ---: | ---: | :--- |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Latest shipped release lineage. Closed; do not reopen for new feature work. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 33 | 4 | Active forward backlog. Promote shaped work from here into a versioned release. |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Skipped public release milestone. Closed lineage retained for issue history. |

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

## Forward Candidate Goalposts

These are planning recommendations from the open tracker state as of
2026-06-13. They are not release commitments until a maintainer moves them into
a versioned release packet.

| Candidate Goalpost | Tracker | Why It Matters Next | Promotion Gate |
| :--- | :--- | :--- | :--- |
| Runtime Graph And Scene IR | Beyond: [#202](https://github.com/flyingrobots/bijou/issues/202), [#209](https://github.com/flyingrobots/bijou/issues/209), [#210](https://github.com/flyingrobots/bijou/issues/210), [#211](https://github.com/flyingrobots/bijou/issues/211), [#212](https://github.com/flyingrobots/bijou/issues/212), [#213](https://github.com/flyingrobots/bijou/issues/213), [#216](https://github.com/flyingrobots/bijou/issues/216), [#219](https://github.com/flyingrobots/bijou/issues/219), [#302](https://github.com/flyingrobots/bijou/issues/302). Triage: [#321](https://github.com/flyingrobots/bijou/issues/321). | This is the current product direction. DX-043 through DX-045 landed `ui-scene-ir/1`, GraphQL-authored `bijou-block/1`, grouped block authoring, and debug facts. DX-046 should prove those contracts against real DOGFOOD product surface. | Promote when a real DOGFOOD fixture has stable GraphQL source, deterministic artifact and IR hashes, terminal receipt proof, source maps, lower modes, and failure tests. |
| DOGFOOD And BlockLab Product Surface | Beyond: [#204](https://github.com/flyingrobots/bijou/issues/204), [#205](https://github.com/flyingrobots/bijou/issues/205), [#214](https://github.com/flyingrobots/bijou/issues/214), [#215](https://github.com/flyingrobots/bijou/issues/215), [#217](https://github.com/flyingrobots/bijou/issues/217), [#218](https://github.com/flyingrobots/bijou/issues/218), [#248](https://github.com/flyingrobots/bijou/issues/248), [#272](https://github.com/flyingrobots/bijou/issues/272). | After IR proof starts touching real DOGFOOD panels, the next pressure is product workflow: better BlockLab stories, file exploration, semantic lists, artifact capture, and docs-as-proof. | Promote when the goalpost has concrete DOGFOOD journeys, BlockLab story fixtures, keyboard/focus proof, localized docs, and capture artifacts that reviewers can inspect without running the whole app. |
| Design Tokens And Theme Modes | Beyond: [#311](https://github.com/flyingrobots/bijou/issues/311), [#315](https://github.com/flyingrobots/bijou/issues/315), [#318](https://github.com/flyingrobots/bijou/issues/318). Triage: [#317](https://github.com/flyingrobots/bijou/issues/317). | DL-013, DL-015, and DL-016 landed the builder, safe-pair, and runtime-mode foundations. Remaining work should turn that foundation into usable inspector, lab, pointer-provenance, and generator workflows. | Promote when the inspector/lab scope has fixture-backed token provenance, safe-pair diagnostics, mode switching proof, and a bounded generator story. |
| Workflow, Capture, And CI Determinism | Beyond: [#203](https://github.com/flyingrobots/bijou/issues/203), [#268](https://github.com/flyingrobots/bijou/issues/268), [#269](https://github.com/flyingrobots/bijou/issues/269), [#270](https://github.com/flyingrobots/bijou/issues/270), [#290](https://github.com/flyingrobots/bijou/issues/290), [#298](https://github.com/flyingrobots/bijou/issues/298), [#299](https://github.com/flyingrobots/bijou/issues/299), [#300](https://github.com/flyingrobots/bijou/issues/300), [#301](https://github.com/flyingrobots/bijou/issues/301). Triage: [#306](https://github.com/flyingrobots/bijou/issues/306), [#249](https://github.com/flyingrobots/bijou/issues/249). | The open Method, replay, policy-script, frame-capture, and CI debt items all point at repeatable proof. #268 remains the right home for an automated tracker-sync sentinel. | Promote when the slice has fake clocks or injected clients, fixture-backed DOGFOOD harnesses, frame-capture artifacts, and CI/merge gates that fail deterministically. |
| Localization And Documentation Operations | Beyond: [#206](https://github.com/flyingrobots/bijou/issues/206), [#207](https://github.com/flyingrobots/bijou/issues/207), [#208](https://github.com/flyingrobots/bijou/issues/208), [#312](https://github.com/flyingrobots/bijou/issues/312). | DOGFOOD Markdown localization now has a debt ratchet, but the operator workflow for translation, preference portability, and scanner coverage is still raw. | Promote when there are docs-module scanner fixtures, preference persistence tests, a DOGFOOD burndown surface, and all-supported-locale proof. |
| Terminal Input And Host Controls | Triage: [#316](https://github.com/flyingrobots/bijou/issues/316). | Real key-state transport matters for game-like controls, but it is unmilestoned and needs design/playback review before release work starts. | Promote only after the transport contract has key-state playback fixtures, focus fallback proof, and compatibility checks for existing command handling. |

## Decision Points

- **Next version**: unnamed. Decide only after the active Runtime Graph And
  Scene IR work either becomes a release goalpost or deliberately stays as
  smaller `Beyond` slices.
- **DX-046 boundary**: Bijou-side only. Wesley and Geordi remain out of the
  critical path until DOGFOOD proves the artifact contracts.
- **Tracker hygiene**: unmilestoned issues with `roadmap`, `work-in-progress`,
  `needs-design`, or `needs-playback` labels should be explicitly triaged before
  agents treat them as release work.
- **Release evidence**: a candidate goalpost needs a release packet before any
  package version is chosen.

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
| [#321](https://github.com/flyingrobots/bijou/issues/321) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Assign to `Beyond` if the fluid-triangle direction becomes part of Runtime Graph And Scene IR or DOGFOOD product surface. |
| [#317](https://github.com/flyingrobots/bijou/issues/317) | `lane:cool-ideas` | `type:enhancement` | Attach to Design Tokens And Theme Modes if Theme Inspector provenance becomes a release goalpost. |
| [#316](https://github.com/flyingrobots/bijou/issues/316) | `lane:cool-ideas` | `type:enhancement` | Shape first; likely needs Terminal Input And Host Controls before milestone assignment. |
| [#306](https://github.com/flyingrobots/bijou/issues/306) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to Workflow, Capture, And CI Determinism because it overlaps replay, output capture, and timing proof. |
| [#249](https://github.com/flyingrobots/bijou/issues/249) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Attach to Workflow, Capture, And CI Determinism if it becomes an enforceable quality gate. |

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
| `v6.0.0` | Skipped public release; closed milestone | Layout truth, standard Blocks, data binding, selection/copy, and status/feedback Blocks. Full lineage lives in the [v6.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/1). |
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
gh pr list --repo flyingrobots/bijou --state open
```

When roadmap triage changes:

1. Move the issue or pull request to the correct GitHub milestone.
2. Preserve the issue's Method lane label unless the lane itself changes.
3. Update this document in the same commit or planning pass.
4. Leave a GitHub comment when moving work between release horizons.
