# WF-167 Roadmap Milestone Authority

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

Tracker: [#514](https://github.com/flyingrobots/bijou/issues/514)

## Sponsor Human

James Ross.

## Sponsor Agent

Codex.

## Decision Summary

Restore one explainable release model across GitHub milestones,
[`ROADMAP.md`](../ROADMAP.md), and [`BEARING.md`](../BEARING.md).

Milestones own release horizons. Labels own work posture. Goalpost issues own
dependency ordering inside a horizon. Documentation mirrors those authorities;
it does not create a competing queue.

The current `v8.0.0` milestone mixes a landed Runtime Graph and Scene IR
contract, an active dependency-security blocker, an additive open Theme Lab
pull request, and twenty-one unfinished perceptual-colour and product-surface
issues. The unfinished colour campaign includes changes explicitly identified
as semver-major. It belongs before the next major release, `v9.0.0`, rather
than becoming a second product contract inside V8.

This cycle therefore:

1. returns `v8.0.0` to Runtime Graph release closeout and dependency security;
2. preserves `v8.1.0` as replay, capture, debugger, graph, and render evidence;
3. preserves `v8.2.0` as quality automation and reliability hardening;
4. makes `v9.0.0` the Product Workbench **and Sapphire Design Language**
   major, including interaction recipes and the State Atlas;
5. keeps `v10.0.0` for renderer and host integration, including the Geordi
   native-GPU cell host;
6. removes stale title and label residue created by earlier Beyond-to-version
   promotion;
7. assigns every open pull request to its evidenced release horizon.

No issue closes in this cycle. No implementation priority is inferred merely
from a milestone move.

## Hill

A maintainer or agent can answer all of these from the live tracker and receive
the same answer from the repository documentation:

- What blocks V8?
- Which work is evidence follow-through rather than release closeout?
- Which visual changes belong to the next semver-major boundary?
- Which ideas are committed, imminent, debt, or optional?
- Which open pull requests participate in each release horizon?
- What must be reconciled before an overlapping pull request can merge?

The answer must not require reading historical comments, inferring semantics
from an issue number, or treating a `lane:cool-ideas` label as a release
commitment.

## Current Truth

The pre-cycle snapshot was taken from GitHub on 2026-08-09 against
`origin/main` at `4412ec6dbce947887ed6ea2740ecbad0a66d122e`.

### Milestone Items Before This Cycle

GitHub milestone totals count issues and pull requests:

| Milestone | Open items | Closed items | Open-issue interpretation |
| :--- | ---: | ---: | :--- |
| `v8.0.0` | 24 | 4 | 23 issues plus PR #509 |
| `v8.1.0` | 13 | 0 | 13 issues |
| `v8.2.0` | 23 | 5 | 22 issues plus PR #467 |
| `v9.0.0` | 15 | 0 | 15 issues |
| `v10.0.0` | 10 | 1 | 10 issues |
| `Beyond` | 0 | 6 | no open work |

Two additional open pull requests were unmilestoned:

- V8 dependency-security PR
  [#492](https://github.com/flyingrobots/bijou/pull/492);
- V10 Geordi native-GPU design PR
  [#511](https://github.com/flyingrobots/bijou/pull/511).

The audit cohort therefore contained `83` open issues and `4` open pull
requests. Opening governance issue #514 increases the live issue total to `84`
and the `v8.2.0` milestone by one item during the cycle.

### V8 Scope Drift

The landed V8 source-side contract is carried by:

- closed parent tracker
  [#302](https://github.com/flyingrobots/bijou/issues/302);
- closed goalpost
  [#457](https://github.com/flyingrobots/bijou/issues/457);
- landed VISOR artifact bundle
  [#458](https://github.com/flyingrobots/bijou/issues/458);
- landed packed-cell adapter
  [#459](https://github.com/flyingrobots/bijou/issues/459).

The active release prerequisite is dependency-security issue
[#482](https://github.com/flyingrobots/bijou/issues/482). Pull requests #492
and #509 overlap on that remediation and must be deduplicated before either is
selected for merge.

Issue #501 was subsequently retargeted from V9 into V8 with its foundation,
correctness, Theme Lab, title-screen, and surface issues. That decision made
the V8 release gate depend on work whose own tracker identifies three
semver-major output changes:

- #496 changes theme decision-rule results;
- #497 changes every first-party theme colour;
- #499 changes ANSI-256 rendered output.

Those changes can land honestly before `v9.0.0`. They need not hold the already
landed V8 product contract open.

### Tracker Hygiene Drift

The live tracker also contains mechanically identifiable residue:

- issues promoted out of `Beyond` retain `[Beyond]` in their titles;
- #204 carries both `lane:inbox` and `lane:cool-ideas`;
- #214, #217, and #218 carry both current `lane:cool-ideas` and legacy
  `lane:up-next`;
- #219 remains `lane:inbox` despite an explicit V10 horizon;
- #348 remains `lane:asap` despite an explicit V10 horizon;
- #249 carries both `priority:medium` and `priority:low`;
- #507 is `lane:bad-code` but lacks the repository's normal `BAD CODE:` title
  signal;
- milestone descriptions do not mention the recently added interaction-state,
  State Atlas, or native-GPU stories.

These are tracker defects, not implementation defects.

## Authority Model

### Milestone: Release Destination

A versioned milestone answers: **if this work lands, which release boundary
owns it?**

A milestone does not mean every issue is committed or next. That posture comes
from `lane:*`, `work-in-progress`, priority, design, and goalpost labels.

### Lane: Commitment And Intake Posture

- `lane:inbox`: not yet shaped;
- `lane:asap`: imminent pull;
- `lane:bad-code`: known debt or structural risk;
- `lane:cool-ideas`: optional or uncommitted exploration;
- `lane:release`: committed release-boundary work.

An issue should carry one current lane. Historical `lane:up-next` residue does
not coexist with the current lane model.

### Goalpost: Dependency And Outcome Authority

Goalpost issues such as #501 own dependency ordering within a release horizon.
Moving a goalpost and its children between release horizons does not reorder
the children. It changes the release boundary that may claim them.

### Documentation: Human-Readable Mirror

`ROADMAP.md` records release horizons, gates, and snapshot totals.
`BEARING.md` records current execution gravity. Neither file overrides live
GitHub state.

## Target Milestone Model

### `v8.0.0`: Runtime Graph Release Closeout

Outcome:

- Runtime Graph and Scene IR product contract is landed;
- dependency advisories reach zero through one selected remediation path;
- release preparation begins only after security truth is reproducible;
- no unfinished colour-system campaign blocks the release.

Expected open items after triage:

- issue #482;
- PR #492;
- PR #509.

The two PRs overlap. Their simultaneous presence records alternatives, not
three independent release blockers.

### `v8.1.0`: Replay, Capture, And Render Evidence

No issue migration is required. The milestone remains the post-contract proof
horizon for replay, capture, debugger, graph, browser, terminal, and parity
witnesses.

Expected open items after triage: `13`.

### `v8.2.0`: Quality Automation And Reliability

Add issue #507 because startup key-conflict reporting is quality enforcement,
not Runtime Graph release scope. Governance issue #514 also lives here because
tracker synchronization is an explicit V8.2 outcome.

Expected open items after triage: `25`:

- `24` open issues, including #507 and #514;
- Dependabot PR #467.

### `v9.0.0`: Product Workbench And Sapphire Design Language

Move the full unfinished campaign cohort from V8:

| Cohort | Issues |
| :--- | :--- |
| Theme and product surfaces | #311, #315, #317, #336, #455, #493, #494, #502 |
| Perceptual foundation and generation | #318, #352, #495, #496, #497, #498, #501, #504 |
| Correctness and accessibility | #499, #500, #505 |
| Theme Lab structural debt | #503, #506 |

The cohort contains `21` issues. It joins the existing `15` V9 issues,
including interaction recipes #512 and State Atlas #513.

Expected open items after triage: `36`.

The count is large because this milestone is an explicit future major horizon,
not because all `lane:cool-ideas` work has become committed. #501 and the
existing Product Workbench stories provide the internal goalposts.

### `v10.0.0`: Renderer And Host Systems Integration

Keep the existing ten issues. Assign PR #511 to the milestone and update the
description to name the Geordi native-GPU cell-host boundary.

Expected open items after triage: `11`.

### `Beyond`: Deliberate Incubation

No issue moves into `Beyond` during this cycle. Explicit release destinations
remain useful. The stale title prefix is removed from issues that already have
a versioned destination.

## Issue Title And Label Normalization

### Remove Stale `[Beyond]` Prefix

Rename these open issues without changing their substantive titles:

- #202 through #219 where the current title begins `[Beyond]`:
  #202, #203, #204, #205, #206, #207, #208, #209, #210, #211, #212, #213,
  #214, #215, #216, #217, #218, and #219.

Each already has an explicit versioned milestone. The prefix now contradicts
the milestone and makes search results look parked when they are not.

### Normalize Lanes And Priority

- #204: remove `lane:inbox`; retain `lane:cool-ideas`.
- #214, #217, #218: remove `lane:up-next`; retain `lane:cool-ideas`.
- #219: replace `lane:inbox` with `lane:cool-ideas`.
- #348: replace `lane:asap` with `lane:cool-ideas`; V10 is a future host and
  renderer horizon, not the imminent V8 pull.
- #249: remove `priority:medium`; retain `priority:low` for the optional
  technical-teardown quality gate.
- #507: rename to `BAD CODE: detect key binding conflicts at frame init` while
  preserving the current debt lane and acceptance criteria.

No blanket priority assignment is introduced. An absent priority is not a
contradiction; two priorities are.

## Pull Request Triage

### PR #492

Assign to `v8.0.0`. It implements the active dependency-security blocker.

### PR #509

Keep in `v8.0.0` because it also implements the same security blocker and its
already-implemented Theme Lab changes are additive. Moving unfinished campaign
issues to V9 does not remove the PR's V8 security relevance.

The PR must reconcile its branch-local roadmap changes with WF-167 before
merge. A significant-event comment will record that consequence.

### PR #511

Assign to `v10.0.0`. It is the design evidence for issue #510 and does not
alter the V8 or V9 release gates.

### PR #467

Keep in `v8.2.0` as dependency-update lineage. Do not close it until one newer
security remediation is selected and merged with evidence that
`brace-expansion@5.0.9` or later is reproducible.

## Migration Ordering

The mutation order prevents documentation from claiming unperformed tracker
state:

1. publish this design and the non-draft cycle PR;
2. update milestone descriptions;
3. move the V9 cohort and #507;
4. assign PR #492 and PR #511;
5. normalize titles, lanes, and #249 priority;
6. comment every release-horizon move;
7. take a fresh milestone-item snapshot;
8. update `ROADMAP.md`, `BEARING.md`, changelog, and tests to that snapshot;
9. verify GitHub read-back and repository gates;
10. update the cycle issue and PR only for material discrepancies.

If any mutation fails, stop and read back the affected issue before retrying.
Do not assume a partial batch succeeded.

## Rollback And Recovery

GitHub issue and milestone edits are individually reversible. The durable
migration table in this design identifies every intended source and target.

If review rejects the model:

- issues can be moved back using the same explicit table;
- titles can regain their previous prefix from GitHub history;
- labels can be restored individually;
- documentation changes can be superseded by a normal follow-up commit;
- no force operation, rebase, amend, or history rewrite is required.

Issue comments remain as provenance and should not be deleted. A rollback
comment should explain the superseding decision.

## Scope

- Audit all open Bijou issues and pull requests at the cycle snapshot.
- Refactor the live milestone assignments and descriptions described above.
- Normalize the bounded title and label defects described above.
- Update roadmap, bearing, changelog, and deterministic policy tests.
- Link and explain the interaction-state, State Atlas, and native-GPU work in
  the correct horizons.
- Preserve the active security and colour branches without editing their
  worktrees.

## Non-Goals

- No issue closure without implementation or explicit disposition evidence.
- No pull request merge, release, tag, or package publication.
- No selection between PR #492 and PR #509.
- No changes to the user-owned dirty `cycle/v8-security-closeout` worktree.
- No changes to the `cycle/colors` worktree.
- No implementation of perceptual colour, Theme Lab debt, interaction
  recipes, State Atlas, replay, or native-GPU rendering.
- No new release milestone; the existing V8, V9, and V10 major boundaries
  already express the required semver ordering.
- No claim that a milestone assignment alone commits a cool idea to ship.

## Tests To Write First

1. Assert the roadmap snapshot contains the exact post-migration milestone-item
   totals.
2. Assert V8 names #482 and the overlapping #492/#509 remediation posture and
   does not list #501 as a release gate.
3. Assert V9 names #501, #512, and #513 and describes Sapphire Design Language
   plus Product Workbench outcomes.
4. Assert V10 names #510 and PR #511 and preserves the native-host claim
   boundary.
5. Assert BEARING reports the same totals and V8 next action.
6. Preserve the milestone-item counting rule: counts include issues and pull
   requests.
7. Preserve the empty open-unmilestoned and open-Beyond policy statements only
   after live GitHub read-back proves them.
8. Keep historic shipped-release lineage unchanged.

## Validation Plan

```bash
npx vitest run --config vitest.config.ts tests/cycles/WF-130
npx vitest run --config vitest.config.ts tests/cycles/DX-050
npx vitest run --config vitest.config.ts tests/cycles/RE-036
npm run docs:inventory
npm run typecheck:test
npm run lint
npm run code-dojo:changed
git diff --check
```

The pre-commit and pre-push hooks remain required. Live GitHub verification is
a separate read-back step because deterministic repository tests must not
depend on network availability.

## Acceptance Criteria

- All `83` pre-cycle issues, issue #514, and all four open pull requests have a
  recorded disposition.
- V8 contains one issue and two competing security implementation PRs.
- V9 contains the full twenty-one-issue Sapphire/design-language cohort.
- V8.2 contains #507 and #514.
- V10 contains PR #511.
- No open issue or pull request is unmilestoned.
- No versioned issue retains `[Beyond]` in its title.
- #204, #214, #217, #218, #219, #348, and #249 have one coherent lane or
  priority posture as specified.
- Every issue moved across a release horizon has a migration comment.
- Milestone descriptions, roadmap, bearing, changelog, and tests match the
  verified post-migration snapshot.
- PR #509 has a visible reconciliation note before its branch can overwrite
  the new roadmap authority.
- No unrelated worktree or GitHub state changes.

## Playback Questions

1. Can a reviewer identify the actual V8 blocker without reading #501 history?
2. Does V9 contain every semver-major colour change and the interaction-state
   work that consumes it?
3. Do lanes still distinguish imminent work, debt, and optional exploration
   inside each versioned horizon?
4. Are every milestone-item total and open-unmilestoned claim backed by live
   GitHub read-back?
5. Did the cycle preserve all issues and dependency relationships instead of
   hiding scope by closing or parking it?
6. Can PR #509 merge later without silently restoring the superseded V8
   campaign assignment?

## Accessibility And Assistive Posture

This is planning and workflow work. It changes no rendered interface. The
roadmap explicitly keeps accessibility and capability-degradation work inside
the V9 State Atlas and colour-distinctness stories rather than treating them as
optional polish.

The issue migration comments and repository documentation remain readable as
plain Markdown without colour, diagrams, or screenshots.

## Localization And Directionality Posture

No localized product copy or runtime directionality behavior changes. V9
continues to own the localization dashboard, portable preferences,
translation workbench, and structured multilingual changelog stories.

Milestone descriptions use concise English tracker metadata; they do not
become application-facing strings.

## Agent Inspectability And Explainability Posture

An agent can inspect:

- the complete source-to-target migration table;
- exact before and after milestone totals;
- which totals include pull requests;
- title and label normalization rules;
- overlapping PR posture;
- release-horizon comments;
- repository tests that bind the durable mirror.

No agent must infer release scope from issue-number ranges, historical
`[Beyond]` prefixes, or branch names.

## Linked Invariants

- [Work Doctrine](../METHOD.md)
- [Documentation Standards](../DOCUMENTATION_STANDARDS.md)
- [TypeScript Code Standards](../typescript-code-standards.editors-edition.md)
- [Roadmap](../ROADMAP.md)
- [Bearing](../BEARING.md)
- [Release Policy](../method/releases/README.md)
- Tracker synchronization idea:
  [#268](https://github.com/flyingrobots/bijou/issues/268)
- Perceptual-colour goalpost:
  [#501](https://github.com/flyingrobots/bijou/issues/501)
- Interaction recipes:
  [#512](https://github.com/flyingrobots/bijou/issues/512)
- State Atlas:
  [#513](https://github.com/flyingrobots/bijou/issues/513)
- Native GPU cell host:
  [#510](https://github.com/flyingrobots/bijou/issues/510)

## Retrospective And Closeout

Open. Closeout requires live GitHub read-back, merged documentation evidence,
and explicit reconciliation of PR #509's branch-local roadmap changes. This
cycle does not close implementation issues or select a security remediation
pull request.
