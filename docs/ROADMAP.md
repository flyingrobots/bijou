# ROADMAP

This roadmap maps GitHub Issues to release horizons.

GitHub milestones and issue labels are the live tracker. This file is the
human-readable release index for the current plan. When an issue moves between
release horizons in GitHub, update this file in the same planning pass.

Last synced from GitHub Issues: 2026-06-01.

## Release Snapshot

| Horizon | Milestone | Open | Closed | Intent |
| :--- | :--- | ---: | ---: | :--- |
| `v6.0.0` | [v6.0.0](https://github.com/flyingrobots/bijou/milestone/1) | 4 | 18 | Current layout truth and standard blocks release lane. |
| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 27 | 0 | Next major-release candidate after v6 triage. |
| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 18 | 0 | Uncommitted future work, cool ideas, and raw follow-ups. |

## v6.0.0

Theme: layout truth and standard blocks.

The v6 lane is the current release target. It should close or explicitly split
the remaining open release issues before tagging.

### Open Work

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#180](https://github.com/flyingrobots/bijou/issues/180) | `lane:release` | `type:enhancement` | RE-035 mandatory layout envelope and constraint negotiation |
| [#181](https://github.com/flyingrobots/bijou/issues/181) | `lane:release` | `type:enhancement` | DX-031 standard Bijou blocks |
| [#182](https://github.com/flyingrobots/bijou/issues/182) | `lane:release` | `type:enhancement` | DX-034 declarative view data binding |
| [#186](https://github.com/flyingrobots/bijou/issues/186) | `lane:release` | `type:enhancement` | DX-030 boundary-aware pointer selection and copy |

### Completed Lineage

These cards are included in the v6 milestone as completed release lineage.

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
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

## v7.0.0

Theme: DOGFOOD truth and remaining component-family audit coverage.

The v7 lane is initial triage, not a release promise. It contains the imported
`up-next` queue that should be reviewed after the v6 release boundary is clear.

### Product And Docs Truth

| Issue | Priority | Type | Work |
| :--- | :--- | :--- | :--- |
| [#244](https://github.com/flyingrobots/bijou/issues/244) | `priority:high` | `type:docs` | DF-030 make DOGFOOD the canonical docs surface |
| [#245](https://github.com/flyingrobots/bijou/issues/245) | `priority:medium` | `type:enhancement` | DX-037 tableSurface responsive width parity |
| [#246](https://github.com/flyingrobots/bijou/issues/246) | `priority:medium` | `type:docs` | DX-029 document scopedNodeIO realpath and symlink semantics |

### Component-Family Audits

| Issue | Priority | Type | Work |
| :--- | :--- | :--- | :--- |
| [#220](https://github.com/flyingrobots/bijou/issues/220) | `priority:medium` | `type:maintenance` | DF-031 audit inline status family across real surfaces |
| [#221](https://github.com/flyingrobots/bijou/issues/221) | `priority:medium` | `type:maintenance` | DF-032 audit in-flow status block family across real surfaces |
| [#222](https://github.com/flyingrobots/bijou/issues/222) | `priority:medium` | `type:maintenance` | DF-033 audit low-level transient overlay family across real surfaces |
| [#223](https://github.com/flyingrobots/bijou/issues/223) | `priority:medium` | `type:maintenance` | DF-035 audit activity stream family across real surfaces |
| [#224](https://github.com/flyingrobots/bijou/issues/224) | `priority:medium` | `type:maintenance` | DF-037 audit inline shortcut cues family across real surfaces |
| [#225](https://github.com/flyingrobots/bijou/issues/225) | `priority:medium` | `type:maintenance` | DF-038 audit progress indicators family across real surfaces |
| [#226](https://github.com/flyingrobots/bijou/issues/226) | `priority:medium` | `type:maintenance` | DF-039 audit framed grouping family across real surfaces |
| [#227](https://github.com/flyingrobots/bijou/issues/227) | `priority:medium` | `type:maintenance` | DF-040 audit explainability walkthroughs family across real surfaces |
| [#228](https://github.com/flyingrobots/bijou/issues/228) | `priority:medium` | `type:maintenance` | DF-042 audit formatted documents and prose family across real surfaces |
| [#229](https://github.com/flyingrobots/bijou/issues/229) | `priority:medium` | `type:maintenance` | DF-043 audit linked destinations family across real surfaces |
| [#230](https://github.com/flyingrobots/bijou/issues/230) | `priority:medium` | `type:maintenance` | DF-044 audit dividers family across real surfaces |
| [#231](https://github.com/flyingrobots/bijou/issues/231) | `priority:medium` | `type:maintenance` | DF-045 audit text entry family across real surfaces |
| [#232](https://github.com/flyingrobots/bijou/issues/232) | `priority:medium` | `type:maintenance` | DF-046 audit single choice family across real surfaces |
| [#233](https://github.com/flyingrobots/bijou/issues/233) | `priority:medium` | `type:maintenance` | DF-047 audit multiple choice family across real surfaces |
| [#234](https://github.com/flyingrobots/bijou/issues/234) | `priority:medium` | `type:maintenance` | DF-048 audit binary decision family across real surfaces |
| [#235](https://github.com/flyingrobots/bijou/issues/235) | `priority:medium` | `type:maintenance` | DF-050 audit peer navigation family across real surfaces |
| [#236](https://github.com/flyingrobots/bijou/issues/236) | `priority:medium` | `type:maintenance` | DF-051 audit progressive disclosure family across real surfaces |
| [#237](https://github.com/flyingrobots/bijou/issues/237) | `priority:medium` | `type:maintenance` | DF-052 audit path and progress family across real surfaces |
| [#238](https://github.com/flyingrobots/bijou/issues/238) | `priority:medium` | `type:maintenance` | DF-054 audit expressive branding and decorative emphasis family across real surfaces |
| [#239](https://github.com/flyingrobots/bijou/issues/239) | `priority:medium` | `type:maintenance` | DF-055 audit mode-aware custom primitives family across real surfaces |
| [#240](https://github.com/flyingrobots/bijou/issues/240) | `priority:medium` | `type:maintenance` | DF-056 audit dense comparison family across real surfaces |
| [#241](https://github.com/flyingrobots/bijou/issues/241) | `priority:medium` | `type:maintenance` | DF-057 audit hierarchy family across real surfaces |
| [#242](https://github.com/flyingrobots/bijou/issues/242) | `priority:medium` | `type:maintenance` | DF-058 audit lists for exploration family across real surfaces |
| [#243](https://github.com/flyingrobots/bijou/issues/243) | `priority:medium` | `type:maintenance` | DF-059 audit temporal or dependency views family across real surfaces |

## Beyond

Theme: future bets, cool ideas, and uncommitted follow-ups.

The Beyond lane is not a release commitment. Items here should be pulled into
`v7.0.0` or a later concrete milestone only after they are shaped.

### Runtime And Visualization Ideas

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#202](https://github.com/flyingrobots/bijou/issues/202) | `lane:cool-ideas` | `type:enhancement` | CI-001 mermaidSurface component |
| [#203](https://github.com/flyingrobots/bijou/issues/203) | `lane:cool-ideas` | `type:spike` | CI-002 deterministic time-travel debugger |
| [#209](https://github.com/flyingrobots/bijou/issues/209) | `lane:cool-ideas` | `type:enhancement` | RE-025 DAG path emphasis |
| [#210](https://github.com/flyingrobots/bijou/issues/210) | `lane:cool-ideas` | `type:enhancement` | RE-026 DAG edge labels |
| [#211](https://github.com/flyingrobots/bijou/issues/211) | `lane:cool-ideas` | `type:enhancement` | RE-027 DAG compact legend mode |
| [#212](https://github.com/flyingrobots/bijou/issues/212) | `lane:cool-ideas` | `type:enhancement` | RE-028 DAG edge semantics and metadata |
| [#213](https://github.com/flyingrobots/bijou/issues/213) | `lane:cool-ideas` | `type:enhancement` | RE-029 DAG adaptive density and lowering |
| [#219](https://github.com/flyingrobots/bijou/issues/219) | `lane:inbox` | `type:enhancement` | RE-027 generalize crash-mode auto-exit beyond TTY detection |

### Product, Localization, And Tooling Ideas

| Issue | Lane | Type | Work |
| :--- | :--- | :--- | :--- |
| [#204](https://github.com/flyingrobots/bijou/issues/204) | `lane:cool-ideas` | `type:enhancement` | DX-027 choose-your-lane starter for README and DOGFOOD |
| [#205](https://github.com/flyingrobots/bijou/issues/205) | `lane:cool-ideas` | `type:enhancement` | HT-009 file explorer surface |
| [#206](https://github.com/flyingrobots/bijou/issues/206) | `lane:cool-ideas` | `type:enhancement` | LX-015 DOGFOOD localization burndown dashboard |
| [#207](https://github.com/flyingrobots/bijou/issues/207) | `lane:cool-ideas` | `type:enhancement` | LX-016 portable locale preferences across hosts |
| [#208](https://github.com/flyingrobots/bijou/issues/208) | `lane:cool-ideas` | `type:enhancement` | LX-017 multilingual DOGFOOD translation workbench |
| [#214](https://github.com/flyingrobots/bijou/issues/214) | `lane:cool-ideas` | `type:spike` | BigBro audit tool |
| [#215](https://github.com/flyingrobots/bijou/issues/215) | `lane:cool-ideas` | `type:spike` | Terminal shader extensions |
| [#216](https://github.com/flyingrobots/bijou/issues/216) | `lane:cool-ideas` | `type:spike` | MCP-driven UI generation |
| [#217](https://github.com/flyingrobots/bijou/issues/217) | `lane:cool-ideas` | `type:enhancement` | bijou-fix-rhythm CLI |
| [#218](https://github.com/flyingrobots/bijou/issues/218) | `lane:cool-ideas` | `type:enhancement` | Semantic list component |

## Maintenance Rule

Use GitHub as the source of truth:

```sh
gh issue list --state all --milestone v6.0.0
gh issue list --state all --milestone v7.0.0
gh issue list --state all --milestone Beyond
```

When roadmap triage changes:

1. Move the issue to the correct GitHub milestone.
2. Preserve the issue's Method lane label unless the lane itself changes.
3. Update this document in the same commit or planning pass.
4. Leave a GitHub comment when moving work between release horizons.
