---
title: HT-007 Focus Map Surface
legend: HT
lane: design
---

# HT-007 Focus Map Surface

## Framing

Focus behavior in complex shells and multi-pane workstations is difficult to
reason about from runtime output alone. The humane terminal story is stronger
when focus ownership is inspectable and explainable.

HT-007 adds a pure focus map report and surface helper. The first slice accepts
focus facts from an app or shell, detects basic focus-health issues, and renders
plain text or a bounded `Surface`.

## Sponsored Users

- App authors debugging tab order and focus ownership.
- Maintainers investigating multi-pane focus regressions.
- Agent workflows that need focus facts as deterministic text.

## Hills

1. A developer can render the current focus map with focused node, owner,
   region, tab order, and disabled state.
2. A maintainer can detect multiple focused nodes, missing focused node,
   focused-disabled nodes, and duplicate tab indexes.
3. A test can render the report as a `Surface` for docs or debug panes.

## Playback Questions

- Does the helper preserve focus ownership and tab order in the report?
- Does the focused node stand out in text output?
- Does issue detection catch no focus, multiple focus, disabled focus, and
  duplicate tab indexes?
- Does the surface helper render a bounded report?
- Does `bijou-tui` export the focus map API from the source barrel?

## Requirements

- Add `focusMapText(nodes, options?)`.
- Add `focusMapSurface(nodes, options?)`.
- Add `inspectFocusMap(nodes)`.
- Support node id, optional owner, optional role, optional rect, optional tab
  index, focusable, focused, and disabled flags.
- Keep the first slice pure; it must expose focus truth, not invent a second
  focus system.

## Acceptance Criteria

- Focused RED tests fail before implementation and pass after.
- Text output includes focused node, ownership, tab order, and issues.
- Surface output respects supplied width and height.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou-tui/src/focus-map.ts`.
- Export it from `packages/bijou-tui/src/index.ts`.
- Keep report ordering deterministic: tab index first, then id.

## Drift Check

- Scope stayed pure and report-only; the helper consumes focus facts supplied by
  an app or shell instead of creating a competing focus manager.
- The first issue set covers foundational focus invariants. Richer trap and
  dead-island detection remains a follow-up because it needs parent/edge facts
  that are not part of this slice.
- Ordering is deterministic: tab index first, then node id.

## Playback

- `inspectFocusMap()` returns ordered nodes, focused node ids, and structured
  issues for missing focus, multiple focused nodes, focused-disabled nodes, and
  duplicate tab indexes.
- `focusMapText()` renders owner, role, rect, tab order, focusable, focused, and
  disabled state, with focused node rows prefixed by `*`.
- `focusMapSurface()` renders the same report as a bounded `Surface`.
- `@flyingrobots/bijou-tui` exports the focus map API from its source barrel.

## Retrospective

- This pairs cleanly with the layout and input-routing inspectors: layout shows
  where regions are, input routing shows how events moved, and the focus map
  shows who currently owns focus.
- App-provided focus facts are the right boundary for the first slice. Inferring
  focus from rendered text would create brittle diagnostics and hide the runtime
  truth the helper is meant to expose.
