---
title: RE-041 v7.2 Framework Input Stabilization
legend: RE
lane: release
priority: high
github_issue: 354
status: proposed
keywords:
  - runtime-engine
  - input-routing
  - mouse
  - driver
  - exports
  - v7.2.0
---

# RE-041 v7.2 Framework Input Stabilization

Legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)

## Linked Work

- Goalpost: [#354](https://github.com/flyingrobots/bijou/issues/354)
- Mouse routing bug: [#344](https://github.com/flyingrobots/bijou/issues/344)
- Public export polish: [#345](https://github.com/flyingrobots/bijou/issues/345)
- Mouse driver builders: [#353](https://github.com/flyingrobots/bijou/issues/353)
- Release milestone:
  [`v7.2.0`](https://github.com/flyingrobots/bijou/milestone/5)

This is the first implementation pull for the `v7.2.0` stabilization release.
It does not replace the `v8.0.0` Runtime Graph and Scene IR product-contract
horizon.

## Decision Summary

The `v7.1.0` release video rehearsal exposed two classes of debt:

1. Product/demo seams in DOGFOOD that make the release story harder to show.
2. Framework input and developer-experience bugs that real consumers hit while
   building pointer-aware layouts.

The first `v7.2.0` pull should repair the framework input path because it is
small, high-confidence, and foundational for later DOGFOOD polish. The selected
slice fixes workspace mouse fallthrough, exports the page-scoped app-frame
helpers that integrations already need, and adds reusable mouse driver helpers
so future pointer regressions can be written as deterministic tests.

## Sponsored Human

A framework user wants a page to receive hover, release, right-click, and other
unmapped workspace pointer events without writing wrapper code around
`app.update`.

A maintainer wants to test those cases without hand-authoring raw mouse
messages in every regression.

## Sponsored Agent

An agent wants pointer behavior to be inspectable through small test-driver
helpers and public app-frame message wrappers instead of brittle imports from
compiled package internals.

## Hill

Given a framed app with an active page, unmapped workspace mouse events fall
through to that page, routed shell mouse actions still belong to the frame, and
tests can express mouse move, press, release, wheel, and SGR sequence playback
through public `@flyingrobots/bijou-tui` helpers.

## Scope

- #344: make `resolveRoutedMouseLayer` return `handled: false` for workspace
  mouse actions that the shell does not own.
- #353: add public test-driver helpers for common mouse actions and raw SGR
  mouse sequence parsing.
- #345: export the page-scoped app-frame message helper surface from
  `packages/bijou-tui/src/index.ts`.
- Add focused regression coverage for workspace mouse fallthrough and the new
  helper/export contract.
- Update docs and changelog evidence.

## Non-Goals

- Do not add pane-level mouse masks or dynamic terminal tracking modes.
- Do not rewrite frame routing or page focus ownership.
- Do not add worker-thread rendering, adaptive frame budgets, or mutable raster
  surfaces.
- Do not make the broader #302 Runtime Graph contract part of this PR.
- Do not repair every DOGFOOD demo issue in the first framework-input pull.

## Current Evidence

`createFramedApp` routes mouse messages through `resolveRoutedMouseLayer`.
When the shell route result is handled, the update loop drains shell commands
and does not call `updateTargetPage`.

The workspace branch currently owns left-click pane selection and scroll, but
it also marks the rest of the workspace mouse stream as handled. That swallows
movement, releases, and non-left presses before the active page can decide
whether it wants them.

`runScript()` already accepts structured mouse steps, and `parseMouse()` can
parse SGR mouse escape sequences. The missing part is a small helper layer that
turns common pointer intent into valid script steps.

`PAGE_MSG_TOKEN`, `wrapPageMsg`, `emitMsgForPage`, and `wrapCmdForPage` already
exist in `app-frame-types.ts`. Consumers should not need to import them through
deep build paths.

## Playback Questions

1. Does an unmapped workspace mouse move reach the active page update function?
2. Does a workspace release or right-click also fall through instead of being
   swallowed?
3. Do frame-owned left-click pane selection and scroll behaviors remain routed
   by the shell?
4. Can tests express mouse move, press, release, wheel, and SGR input without
   duplicating raw `MouseMsg` objects?
5. Can package consumers import the page-scoped frame message helpers from the
   `@flyingrobots/bijou-tui` root?

## Tests To Write First

- A focused app-frame regression that fails before the #344 fix by proving a
  workspace `move` event does not reach the active page.
- Additional focused app-frame assertions for release and non-left press
  fallthrough.
- Driver helper unit tests for move, press, release, wheel, and SGR sequence
  helpers.
- A package-root import test for `PAGE_MSG_TOKEN`, `wrapPageMsg`,
  `emitMsgForPage`, and `wrapCmdForPage`.

## Acceptance Criteria

- Unmapped workspace mouse actions return `handled: false` and fall through to
  the active page.
- Shell-owned workspace mouse actions continue to work.
- Mouse driver helpers are public, typed, documented, and used by at least one
  app-frame regression.
- Page-scoped frame helper exports are available from the package root.
- Focused tests, typecheck, lint, documentation inventory, and diff whitespace
  checks pass before review.
