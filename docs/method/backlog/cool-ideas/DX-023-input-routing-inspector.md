---
title: "DX-023 — Input Routing Inspector"
legend: DX
lane: cool-ideas
---

# DX-023 — Input Routing Inspector

A live inspector that traces key and input routing through shell handlers, page handlers, adapters, and resulting commands/messages.

Why:
- key swallowing and priority mistakes are difficult to diagnose from outside the runtime
- the frame/page binding warning work already proved this seam needs stronger observability
- a first-party inspector would make routing truth visible instead of inferred

Possible scope:
- show raw key input, normalized key, matched handler, and emitted command/message
- explain shell-first vs page-first routing decisions
- flag swallowed keys, shadowed bindings, and no-op handlers
- record the last N routing events for inspection

This should complement, not replace, static warning diagnostics.
