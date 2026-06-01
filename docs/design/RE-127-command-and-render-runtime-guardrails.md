# RE-127 - Command And Render Runtime Guardrails

Linked issues: #127, #129

Linked legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)

## Sponsor Human

A runtime maintainer or app author who needs command and render behavior to
degrade into visible diagnostics instead of opaque hangs or frame stalls.

## Sponsor Agent

A runtime verification agent that checks deterministic command queue,
middleware, and framebuffer invariants.

## Hill

Runaway command production and accidental async render middleware are observable
and testable, while normal high-volume command workloads remain possible.

## Scope

- Expose EventBus command queue diagnostics.
- Add a configurable command backpressure warning threshold.
- Route runtime backpressure warnings through stderr and `routeRuntimeIssue()`.
- Diagnose render middleware that returns a Promise.
- Prevent late async `next()` calls from re-entering the synchronous pipeline.

## Playback Questions

1. Can a test observe pending command count before commands settle?
2. Does a command loop crossing the threshold fire exactly one overload
   diagnostic until it drains below the threshold?
3. Does async render middleware continue the current frame synchronously?
4. Does a late async `next()` fail to re-run downstream stages?

## Accessibility / Assistive Reading Posture

Runtime warnings should be short, concrete, and routed through existing stderr
and application runtime-issue surfaces.

## Localization / Directionality Posture

Warnings are framework diagnostics, not localized user-facing app copy in this
cycle.

## Agent Inspectability / Explainability Posture

Command diagnostics are explicit data via `getCommandDiagnostics()`, and
pipeline diagnostics are asserted through deterministic tests.

## Linked Invariants

- Render stages remain synchronous and stage-ordered.
- Command effects may be async, but their queue state must be observable.
- Diagnostics must not impose a hard cap on legitimate workloads.

## Decisions

- Backpressure is a warning, not a hard cap. Legitimate bursts can exceed the
  threshold, but the runtime reports when pending commands cross it.
- The default threshold is 1000 pending commands. Set
  `commandBackpressureThreshold: 0` to disable the warning.
- Render middleware remains a synchronous contract. Promise-returning
  middleware is diagnosed, the frame continues synchronously, and Promise
  rejection is reported.

## Verification

- `npm test -- --run packages/bijou-tui/src/pipeline/pipeline.test.ts packages/bijou-tui/src/eventbus.test.ts`
- `npm run typecheck:test`

## Tests To Write First

- EventBus backpressure threshold tests.
- Pipeline async-middleware continuation and rejection tests.

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
