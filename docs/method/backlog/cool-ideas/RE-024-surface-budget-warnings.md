---
title: "RE-024 — Surface Budget Warnings"
legend: RE
lane: cool-ideas
---

# RE-024 — Surface Budget Warnings

Opt-in runtime warnings when a render exceeds configurable size, allocation, style, or diff thresholds.

Why:
- many performance regressions are easier to catch during normal development than only in benchmarks
- the runtime now has stronger observability hooks and can surface budget violations directly
- this would support a more disciplined performance culture without requiring a separate bench run every time

Possible scope:
- thresholds for surface area, style churn, diff size, render stage timings, and output volume
- warnings routed through dev IO or diagnostic overlays
- per-app or per-surface budgets
- hooks for CI or test assertions later

The point is early warning, not hard enforcement by default.
