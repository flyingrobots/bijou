# DF-150 - DOGFOOD Terminal Guardrails

Linked issues: #150, #151, #152

Linked legend: [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Sponsor Human

A learner launching DOGFOOD from a terminal who needs to know that it will take
over the screen and how to leave it.

## Sponsor Agent

A docs-surface verification agent that can prove the DOGFOOD entrypoint behaves
deterministically in TTY and non-TTY contexts.

## Hill

DOGFOOD announces its full-screen behavior, prints explicit quit controls, and
refuses to launch through non-interactive stdin/stdout paths that cannot host
the TUI.

## Scope

- Add a terminal readiness helper for the DOGFOOD entrypoint.
- Require both stdin and stdout to be TTYs before launching DOGFOOD.
- Print a short full-screen notice and exit controls before `run(...)`.
- Point scripted callers to the existing smoke command instead of failing
  silently through a pipe or redirected output.
- Cover the guard in docs preview tests.

## Playback Questions

1. Does DOGFOOD tell the user it is about to launch a full-screen TUI?
2. Are the quit controls visible before terminal takeover?
3. Does a non-TTY stdin or stdout path fail with a useful message?
4. Does the message direct automation to the smoke command instead?

## Accessibility / Assistive Reading Posture

The warning is plain text on stderr before alt-screen rendering, so screen
readers and logs can capture it without needing the TUI frame.

## Localization / Directionality Posture

This launch warning is host-entrypoint English text in this cycle.

## Agent Inspectability / Explainability Posture

The readiness helper is a pure function over `ctx.runtime`, so tests can assert
TTY and non-TTY behavior without spawning a terminal.

## Linked Invariants

- Full-screen apps should declare terminal takeover before entering the app.
- Non-interactive execution should point to scripted verification paths.

## Verification

- `npm test -- --run scripts/docs-preview.test.ts`
- `npm run smoke:dogfood:docs`
- `npm run smoke:dogfood:landing`

## Tests To Write First

- Docs preview tests for terminal readiness and entrypoint wiring.

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
