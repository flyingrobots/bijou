---
title: DX-023 Input Routing Inspector
legend: DX
lane: design
---

# DX-023 Input Routing Inspector

## Framing

Key swallowing and priority mistakes are hard to diagnose from outside the
runtime. Frame/page binding warnings already proved this seam needs stronger
observability; developers should not have to infer routing truth from visible
state changes alone.

DX-023 adds a first-party input-routing inspector. The first slice is a pure
history and report helper around existing `RuntimeInputRouteResult` facts. Shell
integration can feed it live records later without changing the core router.

## Sponsored Users

- App authors debugging key priority, shell/page routing, and swallowed input.
- Maintainers investigating runtime routing regressions.
- Agent workflows that need text output for recent input-routing facts.

## Hills

1. A developer can append routing records to a bounded history and inspect the
   last N events.
2. A maintainer can read a text report that shows event kind, visited views,
   handler owner, hit target, commands, effects, swallowed input, and no-op
   handlers.
3. A test can render the same report as a surface for docs or debug panes.

## Playback Questions

- Does the helper retain only the configured number of events?
- Does the text report distinguish key and pointer events?
- Does the report expose visited views, handled/stopped owner, and hit target?
- Does the report flag swallowed input when routing stops unhandled?
- Does the report flag no-op handlers when an event is handled without commands
  or effects?
- Does `bijou-tui` export the inspector API from the source barrel?

## Requirements

- Add `appendInputRoutingRecord(history, record, options?)`.
- Add `inputRoutingInspectorText(history)`.
- Add `inputRoutingInspectorSurface(history, options?)`.
- Accept existing runtime `RuntimeInputEvent` and `RuntimeInputRouteResult`
  objects; do not duplicate router logic.
- Keep the first slice pure and shell-agnostic.

## Acceptance Criteria

- Focused RED tests fail before implementation and pass after.
- Bounded history behavior is deterministic.
- Text reports include routing facts, swallowed status, and no-op status.
- Surface reports render the same text into a bounded `Surface`.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou-tui/src/input-routing-inspector.ts`.
- Export it from `packages/bijou-tui/src/index.ts`.
- Keep command/effect labeling explicit: callers can pass labels, otherwise the
  report shows counts instead of guessing object meaning.

## Drift Check

- Scope stayed on a pure inspector helper. The runtime router and frame shell
  are unchanged.
- Command and effect meaning remains caller-owned. The helper accepts optional
  labels and otherwise reports counts instead of guessing object semantics.
- Live shell integration remains follow-on work; the first slice provides the
  data model, bounded history, text report, and surface rendering.

## Playback

- `appendInputRoutingRecord()` keeps a deterministic bounded history.
- `inputRoutingInspectorText()` distinguishes key and pointer events and shows
  raw input when provided.
- Reports include visited views, handled owner, stopped owner, hit target,
  command/effect labels or counts, swallowed input, and no-op handlers.
- `inputRoutingInspectorSurface()` renders the same report into a bounded
  `Surface`.
- `@flyingrobots/bijou-tui` exports the new API from the source barrel.

## Retrospective

- This complements the layout inspector without coupling to it. Layout explains
  geometry; input routing explains priority and ownership.
- Keeping labels explicit prevents the inspector from turning command objects
  into misleading strings.
