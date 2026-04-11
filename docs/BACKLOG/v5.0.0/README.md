# v5.0.0 — Frame Owns the Pump

Next major version. Architectural changes that justify a semver major bump.

## Shaped scope

- **RE-021** — frame owns the pump: `createFramedApp` owns the render
  loop, timing, frame budget, and perf bookkeeping
- **DL-009** — formalize layout and viewport rules (prerequisite for
  honest scrollbar upstreaming)
- **HT-upstream** — upstream edge-overlay scrollbars and BCSS overflow
  handling from XYPH into bijou-tui
- **RE-020** — typed color representation (numeric RGB as the canonical
  internal form, hex strings at boundaries only)
- **DX-007-decompose** — decompose app-frame mega closure

## Not yet shaped

These are candidates but not committed:

- RE-019 theme token color cache (may fold into RE-020)
- RE-012 pipeline observability hooks
- HT-005 page-provided layer registry
- HT-006 page-level notification push
