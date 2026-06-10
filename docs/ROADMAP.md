# ROADMAP

This roadmap maps GitHub milestone items to release horizons.

GitHub milestones and issue labels are the live tracker. This file is the
human-readable release index for the current plan. When an issue or pull
request moves between release horizons in GitHub, update this file in the same
planning pass.

Release snapshot counts are GitHub milestone item totals: issues and pull
requests assigned to each milestone. They are not issue-only totals. Completed
lineage includes milestone PR rows when those PRs contribute to the totals. Do
not compare release snapshot item totals to issue-only `gh issue list` output
without also accounting for milestone pull requests.

Last synced from GitHub milestone items: 2026-06-09.

## Release Snapshot

| Horizon | Milestone | Open Items | Closed Items | Intent |
| :--- | :--- | ---: | ---: | :--- |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 0 | 30 | Issue-complete layout truth, standard blocks, and status/feedback Block lane. |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 | Issue-complete V7 Product Truth, BlockLab naming, and release-facing proof. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 35 | 1 | Uncommitted future work, cool ideas, and raw follow-ups. |

## v6.0.0

Theme: layout truth, standard blocks, and status/feedback block expansion.

The v6 lane is issue-complete. It should run release-readiness validation and
package checks before tagging.

### Open Work

No open v6 tracker issues remain as of 2026-06-06.

### Completed Lineage

These cards are included in the v6 milestone as completed release lineage.

| Tracker | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#180](https://github.com/flyingrobots/bijou/issues/180) | `lane:release` | `type:enhancement` | RE-035 mandatory layout envelope and constraint negotiation |
| [#181](https://github.com/flyingrobots/bijou/issues/181) | `lane:release` | `type:enhancement` | DX-031 standard Bijou blocks |
| [#182](https://github.com/flyingrobots/bijou/issues/182) | `lane:release` | `type:enhancement` | DX-034 declarative view data binding |
| [#186](https://github.com/flyingrobots/bijou/issues/186) | `lane:release` | `type:enhancement` | DX-030 boundary-aware pointer selection and copy |
| [#250](https://github.com/flyingrobots/bijou/pull/250) | `dependencies` | dependency PR | Vitest `4.0.18` to `4.1.8` release-hygiene bump |
| [#251](https://github.com/flyingrobots/bijou/pull/251) | `lane:release` | implementation PR | RE-035 layout envelope primitives |
| [#183](https://github.com/flyingrobots/bijou/issues/183) | `lane:release` | `type:maintenance` | DF-065 audit workspace layout family across real surfaces |
| [#184](https://github.com/flyingrobots/bijou/issues/184) | `lane:release` | `type:maintenance` | DF-060 audit viewport masking and scrollable inspection panes |
| [#185](https://github.com/flyingrobots/bijou/issues/185) | `lane:release` | `type:enhancement` | DL-012 separate focus gutter chrome from scrollbar UI tokens |
| [#187](https://github.com/flyingrobots/bijou/issues/187) | `lane:release` | `type:maintenance` | DF-063 audit app shell family across real surfaces |
| [#188](https://github.com/flyingrobots/bijou/issues/188) | `lane:release` | `type:enhancement` | DX-032 make createTuiAppSkeleton render consumer pages |
| [#189](https://github.com/flyingrobots/bijou/issues/189) | `lane:release` | `type:maintenance` | DF-064 audit keybinding help and shell hints |
| [#190](https://github.com/flyingrobots/bijou/issues/190) | `lane:release` | `type:maintenance` | DF-061 audit overlay primitives |
| [#191](https://github.com/flyingrobots/bijou/issues/191) | `lane:release` | `type:maintenance` | DF-062 audit notification system |
| [#192](https://github.com/flyingrobots/bijou/issues/192) | `lane:release` | `type:maintenance` | DF-036 audit loading placeholders |
| [#193](https://github.com/flyingrobots/bijou/issues/193) | `lane:release` | `type:maintenance` | DF-041 audit inspector panels |
| [#194](https://github.com/flyingrobots/bijou/issues/194) | `lane:release` | `type:maintenance` | DF-049 audit multi-field and staged forms |
| [#195](https://github.com/flyingrobots/bijou/issues/195) | `lane:release` | `type:maintenance` | DF-066 audit data visualization |
| [#196](https://github.com/flyingrobots/bijou/issues/196) | `lane:release` | `type:enhancement` | DF-027 seed a Storybook-style tool for Bijou blocks and component stories |
| [#197](https://github.com/flyingrobots/bijou/issues/197) | `lane:release` | `type:maintenance` | DX-033 remove showcase layout sludge and manual scrolling/string assembly |
| [#198](https://github.com/flyingrobots/bijou/issues/198) | `lane:release` | `type:maintenance` | WF-009 keep release PRs under automated review file limits |
| [#199](https://github.com/flyingrobots/bijou/issues/199) | `lane:asap` | `type:enhancement` | LX-013 DOGFOOD locale preference persistence |
| [#200](https://github.com/flyingrobots/bijou/issues/200) | `lane:asap` | `type:enhancement` | LX-014 expand DOGFOOD catalog coverage |
| [#201](https://github.com/flyingrobots/bijou/issues/201) | `lane:bad-code` | `type:bug` | Fix the bijou-mcp DAG type mismatch |
| [#220](https://github.com/flyingrobots/bijou/issues/220) | `lane:release` | `type:maintenance` | DF-031 inline status standard Block |
| [#221](https://github.com/flyingrobots/bijou/issues/221) | `lane:release` | `type:maintenance` | DF-032 in-flow status standard Block |
| [#222](https://github.com/flyingrobots/bijou/issues/222) | `lane:release` | `type:maintenance` | DF-033 transient overlay standard Block |
| [#223](https://github.com/flyingrobots/bijou/issues/223) | `lane:release` | `type:maintenance` | DF-035 activity stream standard Block |
| [#224](https://github.com/flyingrobots/bijou/issues/224) | `lane:release` | `type:maintenance` | DF-037 shortcut cue standard Block |
| [#225](https://github.com/flyingrobots/bijou/issues/225) | `lane:release` | `type:maintenance` | DF-038 progress indicator standard Block |

## v7.0.0

Theme: DOGFOOD truth, BlockLab naming, and release-facing proof.

The v7 lane is issue-complete. The component-family audit queue, width parity,
scoped Node I/O semantics, BlockLab naming, workflow evidence, DOGFOOD release
identity, and post-merge review regression fixes are complete. It should run
release-readiness validation before tagging.

### Open Work

No open v7 tracker issues remain as of 2026-06-06.

### Completed Lineage

These cards are included in the v7 milestone as completed release lineage.

| Tracker | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#244](https://github.com/flyingrobots/bijou/issues/244) | `lane:release` | `type:docs` / `type:enhancement` | DF-030 DOGFOOD docs surface Block |
| [#245](https://github.com/flyingrobots/bijou/issues/245) | `lane:release` | `type:enhancement` | DX-037 tableSurface responsive width parity |
| [#246](https://github.com/flyingrobots/bijou/issues/246) | `lane:up-next` | `type:docs` | DX-029 scopedNodeIO realpath and symlink semantics |
| [#278](https://github.com/flyingrobots/bijou/pull/278) | `lane:up-next` | implementation PR | DF-054 through DF-059 late-family DOGFOOD standard Blocks |
| [#279](https://github.com/flyingrobots/bijou/issues/279) | `lane:release` | `type:enhancement` | WF-125 cycle start workflow |
| [#280](https://github.com/flyingrobots/bijou/pull/280) | `lane:release` | implementation PR | WF-125 cycle start workflow |
| [#281](https://github.com/flyingrobots/bijou/issues/281) | `lane:release` | `type:enhancement` | DOGFOOD release title screen |
| [#283](https://github.com/flyingrobots/bijou/issues/283) | `lane:bad-code` / `lane:release` | `type:bug` | V7 Codex review regression fixes |
| [#285](https://github.com/flyingrobots/bijou/issues/285) | `lane:bad-code` / `lane:release` | `type:docs` / `type:maintenance` | V7 tracker docs sync after review follow-up |
| [#226](https://github.com/flyingrobots/bijou/issues/226) | `lane:up-next` | `type:maintenance` | DF-039 framed grouping standard Block |
| [#227](https://github.com/flyingrobots/bijou/issues/227) | `lane:up-next` | `type:maintenance` | DF-040 explainability walkthrough standard Block |
| [#228](https://github.com/flyingrobots/bijou/issues/228) | `lane:up-next` | `type:maintenance` | DF-042 formatted document standard Block |
| [#229](https://github.com/flyingrobots/bijou/issues/229) | `lane:up-next` | `type:maintenance` | DF-043 linked destination standard Block |
| [#230](https://github.com/flyingrobots/bijou/issues/230) | `lane:up-next` | `type:maintenance` | DF-044 divider standard Block |
| [#231](https://github.com/flyingrobots/bijou/issues/231) | `lane:up-next` | `type:maintenance` | DF-045 text entry standard Block |
| [#232](https://github.com/flyingrobots/bijou/issues/232) | `lane:up-next` | `type:maintenance` | DF-046 single choice standard Block |
| [#233](https://github.com/flyingrobots/bijou/issues/233) | `lane:up-next` | `type:maintenance` | DF-047 multiple choice standard Block |
| [#234](https://github.com/flyingrobots/bijou/issues/234) | `lane:up-next` | `type:maintenance` | DF-048 binary decision standard Block |
| [#235](https://github.com/flyingrobots/bijou/issues/235) | `lane:up-next` | `type:maintenance` | DF-050 peer navigation standard Block |
| [#236](https://github.com/flyingrobots/bijou/issues/236) | `lane:up-next` | `type:maintenance` | DF-051 progressive disclosure standard Block |
| [#237](https://github.com/flyingrobots/bijou/issues/237) | `lane:up-next` | `type:maintenance` | DF-052 path progress standard Block |
| [#238](https://github.com/flyingrobots/bijou/issues/238) | `lane:up-next` | `type:maintenance` | DF-054 brand emphasis standard Block |
| [#239](https://github.com/flyingrobots/bijou/issues/239) | `lane:up-next` | `type:maintenance` | DF-055 mode-aware primitive standard Block |
| [#240](https://github.com/flyingrobots/bijou/issues/240) | `lane:up-next` | `type:maintenance` | DF-056 dense comparison standard Block |
| [#241](https://github.com/flyingrobots/bijou/issues/241) | `lane:up-next` | `type:maintenance` | DF-057 hierarchy standard Block |
| [#242](https://github.com/flyingrobots/bijou/issues/242) | `lane:up-next` | `type:maintenance` | DF-058 exploration list standard Block |
| [#243](https://github.com/flyingrobots/bijou/issues/243) | `lane:up-next` | `type:maintenance` | DF-059 temporal dependency standard Block |

### Component-Family Audits

No open component-family audit cards remain in the v7 milestone.

## Beyond

Theme: future bets, cool ideas, debt cleanup, and uncommitted follow-ups.

The Beyond lane is not a release commitment. Items here should be pulled into a
concrete versioned milestone only after they are shaped into goalposts or child
user-story issues.

### Candidate Goalposts From Open GitHub Issues

These groupings are planning recommendations from the open tracker state as of
2026-06-09. They are not commitments until moved into a versioned release
packet and assigned umbrella issues.

| Candidate Goalpost | Open Issues | Why It Exists | Proof Direction |
| :--- | :--- | :--- | :--- |
| Runtime Graph And Scene IR | [#202](https://github.com/flyingrobots/bijou/issues/202), [#209](https://github.com/flyingrobots/bijou/issues/209), [#210](https://github.com/flyingrobots/bijou/issues/210), [#211](https://github.com/flyingrobots/bijou/issues/211), [#212](https://github.com/flyingrobots/bijou/issues/212), [#213](https://github.com/flyingrobots/bijou/issues/213), [#216](https://github.com/flyingrobots/bijou/issues/216), [#219](https://github.com/flyingrobots/bijou/issues/219), [#302](https://github.com/flyingrobots/bijou/issues/302) | Bijou keeps accumulating DAG, Mermaid, MCP, and GraphQL-authored scene ideas. These should become one runtime/IR goalpost instead of drifting as unrelated ideas. DX-042 anchors #302 as shared UI scene IR planning only. | Schema fixtures, lowering tests, DOGFOOD graph examples, lower-mode rendering, and failure-mode contracts. |
| DOGFOOD And BlockLab Product Surface | [#204](https://github.com/flyingrobots/bijou/issues/204), [#205](https://github.com/flyingrobots/bijou/issues/205), [#214](https://github.com/flyingrobots/bijou/issues/214), [#215](https://github.com/flyingrobots/bijou/issues/215), [#217](https://github.com/flyingrobots/bijou/issues/217), [#218](https://github.com/flyingrobots/bijou/issues/218), [#248](https://github.com/flyingrobots/bijou/issues/248), [#272](https://github.com/flyingrobots/bijou/issues/272) | DOGFOOD, BlockLab, file exploration, semantic lists, terminal shaders, and artifact matrices all point at a stronger product-facing component lab. | Scripted DOGFOOD flows, BlockLab story fixtures, image/capture witnesses, keyboard/focus proof, and localized docs. |
| Design Tokens And Theme Modes | [#311](https://github.com/flyingrobots/bijou/issues/311), [#313](https://github.com/flyingrobots/bijou/issues/313), [#315](https://github.com/flyingrobots/bijou/issues/315), [#318](https://github.com/flyingrobots/bijou/issues/318) | Lip Gloss-like styling is valuable only if Bijou preserves its own theme truth: tokens describe semantic color slots, themes own dark/light values, and styles consume resolved colors at render time. DL-013 and DL-015 landed the first builder and safe-pair foundations; DL-016 now targets runtime theme/mode separation. | Builder API tests, theme validation fixtures, style-render resolution tests, safe-pair contrast matrices, lower-mode color proof, DOGFOOD examples, theme-inspector and theme-lab UX, theme-generator spikes, and inspectability facts. |
| Workflow And CI Determinism | [#203](https://github.com/flyingrobots/bijou/issues/203), [#268](https://github.com/flyingrobots/bijou/issues/268), [#269](https://github.com/flyingrobots/bijou/issues/269), [#270](https://github.com/flyingrobots/bijou/issues/270), [#290](https://github.com/flyingrobots/bijou/issues/290), [#298](https://github.com/flyingrobots/bijou/issues/298), [#299](https://github.com/flyingrobots/bijou/issues/299), [#300](https://github.com/flyingrobots/bijou/issues/300), [#301](https://github.com/flyingrobots/bijou/issues/301) | The open bad-code and Method ideas share a dependency-injection, fake-clock, replay, and tracker-sync theme. They should become one proof and determinism goalpost. | Fake clocks, injected git/GitHub clients, fixture-backed DOGFOOD harnesses, path-gated CI proof, and merge-gate tests. |
| Localization And Documentation Operations | [#206](https://github.com/flyingrobots/bijou/issues/206), [#207](https://github.com/flyingrobots/bijou/issues/207), [#208](https://github.com/flyingrobots/bijou/issues/208), [#312](https://github.com/flyingrobots/bijou/issues/312) | DOGFOOD Markdown localization now has a debt ratchet; the next shaped step is an operator-facing translation and preference workflow. | Localization debt tests, preference persistence fixtures, DOGFOOD dashboards, full docs-module scanner coverage, and all-supported-locale proof. |

### Open Beyond Issues

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
| [#313](https://github.com/flyingrobots/bijou/issues/313) | `lane:bad-code` | `type:maintenance` | Legacy Theme remains single-mode beside DL-013 mode-aware themes |
| [#315](https://github.com/flyingrobots/bijou/issues/315) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | DOGFOOD theme lab and preset gallery |
| [#318](https://github.com/flyingrobots/bijou/issues/318) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Rampensau-inspired Bijou theme generator |

### Closed Beyond Lineage

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#289](https://github.com/flyingrobots/bijou/issues/289) | `lane:cool-ideas` / `lane:release` | `type:enhancement` / `type:docs` | Release title screens as first-class artifact gallery |

### Open Unmilestoned Triage

These issues are open but not assigned to a release horizon. Move them into
`Beyond` or a versioned release after shaping.

| Issue | Lane | Type | Recommendation |
| :--- | :--- | :--- | :--- |
| [#249](https://github.com/flyingrobots/bijou/issues/249) | `lane:cool-ideas` | `type:enhancement` / `type:docs` | Attach to the Workflow And CI Determinism goalpost if it becomes an enforceable quality gate. |
| [#306](https://github.com/flyingrobots/bijou/issues/306) | `lane:cool-ideas` | `type:enhancement` / `type:spike` | Attach to the Workflow And CI Determinism goalpost because it overlaps replay, output capture, and timing proof. |

## Maintenance Rule

Use GitHub as the source of truth:

```sh
gh issue list --state all --milestone v6.0.0
gh pr list --state all --search 'milestone:"v6.0.0"'
gh issue list --state all --milestone v7.0.0
gh pr list --state all --search 'milestone:"v7.0.0"'
gh issue list --state all --milestone Beyond
gh pr list --state all --search 'milestone:Beyond'
```

When roadmap triage changes:

1. Move the issue or pull request to the correct GitHub milestone.
2. Preserve the issue's Method lane label unless the lane itself changes.
3. Update this document in the same commit or planning pass.
4. Leave a GitHub comment when moving work between release horizons.
