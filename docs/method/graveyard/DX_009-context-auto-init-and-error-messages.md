---
title: DX-009 — Auto-Init Context and Actionable Error Messages
lane: graveyard
legend: DX
---

# DX-009 — Auto-Init Context and Actionable Error Messages

## Disposition

Completed on release/v4.5.0. Ambient default-context bootstrapping is now host-pluggable through the core default-context initializer seam, @flyingrobots/bijou-node registers the Node initializer so common run() flows no longer require a manual initDefaultContext() call, runtime startup errors now point directly at the Node setup guide, and createFramedApp emits a one-time runtime warning when frame-first shell bindings shadow page key bindings.

Replacement: `docs/method/graveyard/DX_009-context-auto-init-and-error-messages.md`

## Original Proposal

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Problem

Every bijou app must call `initDefaultContext()` before `run()`. If
forgotten, the error is "No default BijouContext has been set" —
which tells you what's wrong but not how to fix it.

Also, `keyPriority` defaults to `'frame-first'`, meaning shell
keybindings silently win over page keybindings. A developer binding
`?` to their own action won't see it fire because help consumes it.

## Desired outcome

1. `run()` auto-initializes context if no `ctx` is provided and no
   default exists. Error message on failure includes fix instructions
   and a docs link.
2. `createFramedApp` emits a runtime warning via `routeRuntimeIssue`
   when a page keyMap binding collides with a frameKeys binding under
   `frame-first` priority.

## Effort

Small — two localized changes.
