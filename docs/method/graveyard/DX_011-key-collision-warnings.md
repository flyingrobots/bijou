---
title: DX-011 — Key Collision Warnings at Registration Time
lane: graveyard
legend: DX
---

# DX-011 — Key Collision Warnings at Registration Time

## Disposition

Repo truth already ships this warning. `createFramedApp()` queues a runtime warning when a page key binding is shadowed by a frame binding under `keyPriority: 'frame-first'`, and `app-frame.test.ts` already covers both the warning emission and the once-per-page guard. The backlog note is stale relative to shipped behavior.

## Original Proposal

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

When `createFramedApp` is called with pages that have keybindings
which collide with the frame's built-in bindings (help `?`, settings
`ctrl+,`, quit `escape`, etc.), emit a warning through
`routeRuntimeIssue` at app initialization time — not at key-press
time.

```
[Framework warning] Page "editor" binds "?" but frame-first key
priority means the frame's help toggle will consume it. Use
keyPriority: 'page-first' or choose a different key.
```

## Why

Currently, a developer binds `?` to "show info" in their page, runs
the app, presses `?`, and sees the help overlay instead of their
handler. There is no diagnostic — the key is silently consumed. The
developer has to read the frame-first/page-first docs to understand
what happened.

A warning at registration time catches this immediately.
