# ROADMAP

This roadmap maps GitHub milestone items to release horizons.

GitHub milestones, issues, pull requests, and labels are the live tracker. This
file is the human-readable release index for the current plan. When an issue or
pull request moves between release horizons in GitHub, update this file in the
same planning pass.

Release snapshot counts are GitHub milestone item totals: issues and pull
requests assigned to each milestone. They are not issue-only totals. Do not
compare release snapshot item totals to issue-only `gh issue list` output
without also accounting for milestone pull requests.

Last synced from GitHub milestone items: 2026-06-13.

## How To Read This File

- `docs/release.md` owns release process and shipped-release posture.
- `docs/BEARING.md` owns immediate direction and active tensions.
- This file owns the release-horizon index: closed lineage, post-v7 candidate
  goalposts, open `Beyond` items, unmilestoned triage, and open pull requests.
- No next public release version is selected here. Select one only after a
  candidate goalpost is moved from `Beyond` into a versioned release packet.

## Release Snapshot

| Horizon | Milestone | Open Items | Closed Items | Current Posture |
| :--- | :--- | ---: | ---: | :--- |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Closed milestone lineage for layout truth, standard Blocks, and status/feedback Blocks. Not a pending package tag. |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Latest shipped public release lineage: DOGFOOD truth, BlockLab naming, release-facing proof. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 33 | 4 | Post-v7 backlog, cool ideas, debt cleanup, and uncommitted follow-ups. |

## Latest Shipped Release

The latest shipped public release is
[`v7.0.0`](https://github.com/flyingrobots/bijou/releases/tag/v7.0.0),
published on 2026-06-03. Package manifests are still at `7.0.0`, and all work
after that tag is currently unreleased.

`v7.0.0` is the current release boundary. Do not treat `v6.0.0` or `v7.0.0`
milestone cleanup as the next implementation target.

## Closed Release Lineage

### v6.0.0

Theme: layout truth, standard Blocks, and status/feedback Block expansion.

The v6 milestone is closed tracker lineage. Its work was folded into the
release history before the latest public release boundary. The current tag set
does not contain a `v6.0.0` package release, so this lane should remain
historical unless a maintainer explicitly reopens that release decision.

Completed proof includes:

- RE-035 mandatory layout envelope and constraint negotiation
- DX-031 standard Bijou Blocks
- DX-034 declarative view data binding
- DX-030 boundary-aware pointer selection and copy
- DF-031 through DF-038 status/feedback standard Blocks
- DOGFOOD family audits and release-hygiene follow-through

The full issue and PR lineage lives in the
[v6.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/1).

### v7.0.0

Theme: DOGFOOD truth, BlockLab naming, and release-facing proof.

The v7 milestone is closed tracker lineage and shipped as the latest public
release. It should not be reopened for new feature work; shape new work in
`Beyond` or in a new versioned release packet.

Completed proof includes:

- DF-030 DOGFOOD docs surface Block
- DX-037 `tableSurface()` responsive width parity
- DX-029 scoped Node I/O realpath and symlink semantics
- WF-125 cycle-start workflow
- DOGFOOD release-title proof surface
- V7 tracker sync and review regression fixes
- the late DOGFOOD component-family Block contract six-packs

The full issue and PR lineage lives in the
[v7.0.0 milestone](https://github.com/flyingrobots/bijou/milestone/2).

## Active Post-v7 Pull

The active implementation gravity is **DX-046: GraphQL-authored DOGFOOD block
fixture for #302**.

The intended proof path is:

```text
GraphQL SDL fixture
  -> bijou-block/1 grouped artifact
    -> ui-scene-ir/1
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
          -> DOGFOOD product facts
```

This is not yet a versioned release. Keep it inside Bijou until one real
DOGFOOD block or panel proves the source, artifact, IR, terminal, and debug
contracts before Wesley or Geordi integration enters the critical path.

## Post-v7 Candidate Goalposts

These groupings are planning recommendations from the open tracker state as of
2026-06-13. They are not commitments until moved into a versioned release
packet and assigned umbrella issues.

| Candidate Goalpost | Current Tracker | Current Posture | Proof Direction |
| :--- | :--- | :--- | :--- |
| Runtime Graph And Scene IR | Beyond: [#202](https://github.com/flyingrobots/bijou/issues/202), [#209](https://github.com/flyingrobots/bijou/issues/209), [#210](https://github.com/flyingrobots/bijou/issues/210), [#211](https://github.com/flyingrobots/bijou/issues/211), [#212](https://github.com/flyingrobots/bijou/issues/212), [#213](https://github.com/flyingrobots/bijou/issues/213), [#216](https://github.com/flyingrobots/bijou/issues/216), [#219](https://github.com/flyingrobots/bijou/issues/219), [#302](https://github.com/flyingrobots/bijou/issues/302). Triage: [#321](https://github.com/flyingrobots/bijou/issues/321). | DX-043 through DX-045 landed the portable `ui-scene-ir/1` seed, GraphQL-authored `bijou-block/1` proof, grouped block authoring, and deterministic debug facts. #302 is WIP and should pull DX-046 next. #321 is related but not yet assigned to a release horizon. | Schema fixtures, DOGFOOD product fixtures, source-map receipts, terminal proof, lower modes, debug summaries, failure-mode contracts. |
| DOGFOOD And BlockLab Product Surface | Beyond: [#204](https://github.com/flyingrobots/bijou/issues/204), [#205](https://github.com/flyingrobots/bijou/issues/205), [#214](https://github.com/flyingrobots/bijou/issues/214), [#215](https://github.com/flyingrobots/bijou/issues/215), [#217](https://github.com/flyingrobots/bijou/issues/217), [#218](https://github.com/flyingrobots/bijou/issues/218), [#248](https://github.com/flyingrobots/bijou/issues/248), [#272](https://github.com/flyingrobots/bijou/issues/272). | DOGFOOD, BlockLab, file exploration, semantic lists, terminal shaders, and artifact matrices point at a stronger product-facing component lab, but this is not the immediate DX-046 pull. | Scripted DOGFOOD flows, BlockLab story fixtures, image/capture witnesses, keyboard/focus proof, localized docs. |
| Design Tokens And Theme Modes | Beyond: [#311](https://github.com/flyingrobots/bijou/issues/311), [#315](https://github.com/flyingrobots/bijou/issues/315), [#318](https://github.com/flyingrobots/bijou/issues/318). Triage: [#317](https://github.com/flyingrobots/bijou/issues/317). | DL-013, DL-015, and DL-016 landed the builder, safe-pair, and runtime-mode foundations. Remaining work is inspector, lab, pointer-provenance, and generator UX. | Builder API tests, validation fixtures, style-render resolution tests, contrast matrices, lower-mode color proof, Theme Inspector and Theme Lab UX. |
| Workflow, Capture, And CI Determinism | Beyond: [#203](https://github.com/flyingrobots/bijou/issues/203), [#268](https://github.com/flyingrobots/bijou/issues/268), [#269](https://github.com/flyingrobots/bijou/issues/269), [#270](https://github.com/flyingrobots/bijou/issues/270), [#290](https://github.com/flyingrobots/bijou/issues/290), [#298](https://github.com/flyingrobots/bijou/issues/298), [#299](https://github.com/flyingrobots/bijou/issues/299), [#300](https://github.com/flyingrobots/bijou/issues/300), [#301](https://github.com/flyingrobots/bijou/issues/301). Triage: [#306](https://github.com/flyingrobots/bijou/issues/306), [#249](https://github.com/flyingrobots/bijou/issues/249). | The open Method, replay, policy-script, frame-capture, and CI debt items all share a determinism and evidence theme. #268 remains the proper home for a future tracker-sync sentinel; this roadmap refresh is only the manual cleanup. | Fake clocks, injected git/GitHub clients, fixture-backed DOGFOOD harnesses, frame-capture artifacts, path-gated CI proof, merge-gate tests. |
| Localization And Documentation Operations | Beyond: [#206](https://github.com/flyingrobots/bijou/issues/206), [#207](https://github.com/flyingrobots/bijou/issues/207), [#208](https://github.com/flyingrobots/bijou/issues/208), [#312](https://github.com/flyingrobots/bijou/issues/312). | DOGFOOD Markdown localization has a debt ratchet; the next shaped step is operator-facing translation, preference, and scanner coverage work. | Localization debt tests, preference fixtures, DOGFOOD dashboards, docs-module scanner coverage, all-supported-locale proof. |
| Terminal Input And Host Controls | Triage: [#316](https://github.com/flyingrobots/bijou/issues/316). | Real key-state transport for game-like controls is open, unmilestoned, and needs design/playback review before it becomes release work. | Input transport fixtures, key-state playback, focus/terminal fallback proof, compatibility checks for existing TUI command handling. |

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

## Closed Beyond Lineage

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#289](https://github.com/flyingrobots/bijou/issues/289) | `lane:cool-ideas` / `lane:release` | `type:enhancement` / `type:docs` | Release title screens as first-class artifact gallery |
| [#308](https://github.com/flyingrobots/bijou/issues/308) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | DL-013 design token and theme builder API |
| [#313](https://github.com/flyingrobots/bijou/issues/313) | `lane:bad-code` | `type:maintenance` | Legacy Theme remains single-mode beside DL-013 mode-aware themes |
| [#314](https://github.com/flyingrobots/bijou/issues/314) | `lane:cool-ideas` | `type:enhancement` | DL-015 theme safe-pair contracts and contrast matrices |

## Open Unmilestoned Triage

These issues are open but not assigned to a release horizon. Move them into
`Beyond` or a versioned release only after shaping.

| Issue | Lane | Type | Recommendation |
| :--- | :--- | :--- | :--- |
| [#321](https://github.com/flyingrobots/bijou/issues/321) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Assign to `Beyond` if the Geordi-backed fluid triangle concept becomes part of the Runtime Graph And Scene IR or DOGFOOD product-surface queue. |
| [#317](https://github.com/flyingrobots/bijou/issues/317) | `lane:cool-ideas` | `type:enhancement` | Attach to Design Tokens And Theme Modes if Theme Inspector provenance becomes a release goalpost. |
| [#316](https://github.com/flyingrobots/bijou/issues/316) | `lane:cool-ideas` | `type:enhancement` | Shape first; this likely needs a Terminal Input And Host Controls goalpost before milestone assignment. |
| [#306](https://github.com/flyingrobots/bijou/issues/306) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to Workflow, Capture, And CI Determinism because it overlaps replay, output capture, and timing proof. |
| [#249](https://github.com/flyingrobots/bijou/issues/249) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Attach to Workflow, Capture, And CI Determinism if it becomes an enforceable quality gate. |

## Open Pull Requests Outside Release Horizons

These pull requests are open and unmilestoned. They are not part of a release
horizon until GitHub metadata says so.

| PR | Type | Current Posture |
| :--- | :--- | :--- |
| [#326](https://github.com/flyingrobots/bijou/pull/326) | dependency PR | Open Dependabot PR for `esbuild` `0.28.0` to `0.28.1`; no release milestone assigned. |

## Maintenance Rule

Use GitHub as the source of truth:

```sh
gh api repos/flyingrobots/bijou/milestones --method GET -f state=all --paginate
gh issue list --state all --milestone v6.0.0
gh pr list --state all --search 'milestone:"v6.0.0"'
gh issue list --state all --milestone v7.0.0
gh pr list --state all --search 'milestone:"v7.0.0"'
gh issue list --state all --milestone Beyond
gh pr list --state all --search 'milestone:Beyond'
gh search issues --repo flyingrobots/bijou --state open --no-milestone
gh pr list --repo flyingrobots/bijou --state open
```

When roadmap triage changes:

1. Move the issue or pull request to the correct GitHub milestone.
2. Preserve the issue's Method lane label unless the lane itself changes.
3. Update this document in the same commit or planning pass.
4. Leave a GitHub comment when moving work between release horizons.
