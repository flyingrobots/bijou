# DF-003 — Enforce DOGFOOD Coverage Floor

_Cycle for turning DOGFOOD coverage honesty into a CI-enforced release gate instead of a passive progress display_

Legend:

- [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-001 — Show DOGFOOD Coverage Progress](./DF-001-show-dogfood-coverage-progress.md)

## Why this cycle exists

DF-001 made DOGFOOD honest about how incomplete it currently is.

That honesty should not remain a purely visual promise. The repo should also enforce a minimum documentation floor so DOGFOOD cannot quietly regress or ship while pretending its progress bar means something.

This cycle exists to:

- make the minimum acceptable DOGFOOD coverage explicit
- enforce that minimum in CI and release-readiness flows
- document the ratchet policy for future DF cycles

## Human users / jobs / hills

### Primary human users

- maintainers shipping Bijou releases
- contributors expanding or touching DOGFOOD docs coverage
- reviewers deciding whether a cycle improved or regressed documentation completeness

### Human jobs

1. Ship Bijou without accidentally letting DOGFOOD coverage slip below the current honest bar.
2. See the current floor and next expected target without reverse-engineering old commits.
3. Treat docs completeness as a real quality gate, not a vague aspiration.

### Human hill

DOGFOOD coverage progress is not just displayed in the app; it is enforced in the repo and raised deliberately over time.

## Agent users / jobs / hills

### Primary agent users

- agents expanding DOGFOOD stories
- agents preparing release candidates
- agents auditing whether documentation completeness is meeting the current floor

### Agent jobs

1. Compute the current DOGFOOD family-coverage ratio from source data.
2. Compare that ratio against an explicit floor.
3. Fail deterministically when the floor is not met.
4. Surface the next required target so future cycles know the next ratchet point.

### Agent hill

An agent can determine from source-controlled policy whether the current DOGFOOD story set is acceptable for CI and release without heuristics or manual judgment.

## Human playback

1. A maintainer opens the repo after a coverage-expansion cycle.
2. The DOGFOOD coverage floor is explicit in source control.
3. CI checks the current real story coverage against that floor.
4. If coverage drops below the floor, CI fails before merge or release.
5. The maintainer can also see the next target to raise by in the next dedicated DOGFOOD coverage cycle.

## Agent playback

1. An agent computes DOGFOOD coverage from `stories.ts` and the canonical component-family reference.
2. The agent reads the explicit floor and next target from the shared policy module.
3. The agent runs the coverage gate script.
4. If coverage is below the floor, the script fails with the measured percent, floor, and next target.
5. If coverage meets the floor, CI proceeds and the next ratchet remains visible for future cycles.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)

## Implementation outline

1. Add a shared DOGFOOD coverage-policy module with:
   - explicit floor percent
   - explicit +5-point ratchet increment
   - explicit next target
   - helpers for evaluating/asserting the floor
2. Add a `dogfood:coverage:gate` script that computes real coverage and fails when the floor is not met.
3. Add focused tests for the policy and gate behavior.
4. Wire the gate into CI and release-readiness flows.
5. Update DF legend/changelog and spawn the next backlog item for actually raising the floor.

## Tests to write first

- cycle doc regression for DF-003 and its follow-on backlog item
- policy/gate tests proving:
  - current coverage meets the current floor
  - the next target is exactly floor + 5
  - the gate fails when the floor is set above current coverage
- release-readiness regression proving the new gate runs as part of the plan

## Risks / unknowns

- CI can enforce the current floor, but it cannot infer from git history whether maintainers actually raised the floor every time they should have
- the initial floor needs to be set to the current honest value, not an aspirational one that would immediately fail the repo
- the meaningful follow-on is expanding DOGFOOD coverage itself, not only adding more policy

## Retrospective

What landed:

- explicit DOGFOOD coverage floor policy in source control
- a reusable coverage gate script
- CI/release hooks enforcing the current floor
- an explicit next target to make the next +5-point ratchet visible

What did not land:

- actual new DOGFOOD component-family stories
- automatic historical enforcement of “every cycle raised by 5” beyond the explicit next-target ratchet

Follow-on:

- [DF-004 — Raise DOGFOOD Coverage Floor to the Next 5-Point Target](../BACKLOG/DF-004-raise-dogfood-coverage-floor-to-next-target.md)
