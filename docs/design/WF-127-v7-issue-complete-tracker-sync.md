---
title: WF-127 V7 issue-complete tracker sync
legend: WF
lane: bad-code
priority: medium
issue: https://github.com/flyingrobots/bijou/issues/285
keywords:
  - tracker
  - roadmap
  - bearing
  - v7
  - release-readiness
---

# WF-127 V7 Issue-Complete Tracker Sync

## Framing

GitHub is the live tracker for Bijou work. After the V7 Product Truth closeout,
the post-merge Codex review follow-up, and this tracker-sync cleanup, the
`v7.0.0` milestone should be issue-complete: zero open milestone items and
twenty-seven closed milestone items.

The repository mirrors did not fully follow that state. `BEARING.md`,
`ROADMAP.md`, and the WF-126 regression still describe the pre-merge V7
closeout with #245, #246, and #281 as open work. That creates the exact
tracker/docs drift the Method calls out as bad code.

## Sponsored Users

- A release maintainer needs BEARING and ROADMAP to match GitHub before running
  release-readiness validation.
- A review agent needs the tracker-sync regression to encode the issue-complete
  state, not the old closeout state.
- A contributor scanning the repo needs to see release-readiness as the next
  action instead of chasing already-closed V7 issues.

## Hill

A maintainer preparing V7 can read BEARING, ROADMAP, and the WF-126 regression
and see the same truth as the GitHub milestone after this PR closes #285: V7
has no open milestone items, has twenty-seven closed milestone items, and
should move to release-readiness validation.

## Current Truth

- GitHub milestone `v7.0.0` before this cleanup issue: `1` open / `26` closed,
  because #285 is now the only open V7 item.
- GitHub milestone `v7.0.0` after this cleanup issue closes: `0` open / `27`
  closed. The milestone count includes milestone PRs as well as issues.
- `docs/BEARING.md` still says the V7 current open count is three.
- `docs/ROADMAP.md` still reports V7 as `3` open / `20` closed.
- `tests/cycles/WF-126/v7-closeout-tracker-sync.test.ts` still expects #245,
  #246, and #281 in the open-work area.

## Product Shape

### BEARING

```text
Active Gravity
  v7.0.0 is issue-complete
  next action: release-readiness validation
```

### ROADMAP

```text
| v7.0.0 | 0 open | 27 closed | Issue-complete V7 Product Truth |

Open Work
  No open v7 tracker issues remain as of 2026-06-03.
```

### Regression

```text
WF-126
  expect roadmap v7 row to contain | 0 | 27 |
  expect closed issue lineage to include #245, #246, #281, #283, #285
  expect no open-work rows for #245/#246/#281
```

## Runtime And API Contract

This is a documentation and workflow-proof cycle. It does not change runtime
APIs, package exports, or user-facing DOGFOOD behavior.

## Lower Modes

No lower-mode product output changes are intended.

## Tests To Write First

- Update `tests/cycles/WF-126/v7-closeout-tracker-sync.test.ts` so it fails
  against the current stale BEARING and ROADMAP state.
- Keep the test scoped to local repo evidence. The GitHub query remains the
  operator's source of truth; the regression prevents the checked-in mirror from
  drifting again.

## Acceptance Criteria

- Issue #285 is closed by the PR.
- BEARING no longer lists #245, #246, or #281 as open V7 work.
- ROADMAP reports `v7.0.0` as `0` open and `27` closed.
- ROADMAP lists #245, #246, #281, #283, and #285 in V7 completed lineage.
- WF-126 passes.
- CHANGELOG records the bad-code tracker sync fix.

## Risks And Guardrails

- Do not cut, tag, or publish V7 in this cycle.
- Do not implement the broader tracker-sync sentinel from #268 here.
- Do not move Beyond issues into V7 as part of this cleanup.
- Do not make BEARING or ROADMAP the source of truth. They mirror GitHub.
