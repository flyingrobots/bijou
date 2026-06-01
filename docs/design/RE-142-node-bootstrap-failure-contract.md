# RE-142 - Node Bootstrap Failure Contract

Linked issues: #142, #143, #144

Linked legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)

## Sponsor Human

A Node host app author who needs startup failures to explain whether the
terminal, raw mode, stdout dimensions, or ambient context is the problem.

## Sponsor Agent

A runtime verification agent that can assert a stable bootstrap error contract
instead of matching ad hoc process or terminal errors.

## Hill

`initDefaultContext()` startup failures are represented by
`BijouBootstrapError` with stable `reason`, `hint`, and optional `cause`
fields, and the docs explain the expected recovery paths.

## Scope

- Add tests for the structured bootstrap error object.
- Add a deterministic stdout-dimension failure test.
- Document the reason/hint/cause contract in `@flyingrobots/bijou-node` docs.
- Preserve existing behavior for successful context initialization.

## Playback Questions

1. Does `BijouBootstrapError` preserve reason, hint, and cause?
2. Does `initDefaultContext()` produce a structured error for unusable stdout
   dimensions?
3. Do package docs explain the recovery path for common host startup failures?

## Accessibility / Assistive Reading Posture

Hints should be direct recovery text that a human can act on from a terminal
error or test failure.

## Localization / Directionality Posture

Bootstrap diagnostics remain developer-facing English strings in this cycle.

## Agent Inspectability / Explainability Posture

Tests assert the stable error fields directly, so agents should not need to
parse terminal-specific stack traces.

## Linked Invariants

- Host initialization failures need structured facts.
- Ambient process state should not be the only way tests can reason about
  startup failures.

## Verification

- `npm test -- --run packages/bijou-node/src/index.test.ts`
- `npm run typecheck:test`

## Tests To Write First

- Structured error object test.
- Deterministic stdout dimension failure test.

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
