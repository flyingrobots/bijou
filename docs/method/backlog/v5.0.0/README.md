# v5.0.0 — Frame Owns the Pump

Next major version. These items are still live shaping work and now belong
to the canonical METHOD backlog instead of the legacy `docs/BACKLOG/`
surface.

## Shaped Scope

- [**RE-021**](./RE-021-frame-owns-the-pump.md) — frame owns the pump:
  `createFramedApp` owns the render loop, timing, frame budget, and perf
  bookkeeping
- [**DL-009**](./DL-009-formalize-layout-and-viewport-rules.md) —
  formalize layout and viewport rules as the prerequisite for honest
  scrollbar upstreaming
- [**HT-upstream**](./HT_upstream-edge-overlay-scrollbars-and-bcss-overflow-handling.md) —
  upstream edge-overlay scrollbars and BCSS overflow handling from XYPH
  into `bijou-tui`
- [**RE-020**](./RE-020-typed-color-representation.md) — typed color
  representation: numeric RGB as the canonical internal form, hex
  strings only at the boundaries
- [**DX-007-decompose**](../bad-code/DX-007-decompose-app-frame-mega-closure.md) —
  decompose the `app-frame.ts` mega-closure

## Adjacent Work

Still-open related ideas:

- [RE-019 — Pre-Parse Theme Token Colors Into Bytes](../cool-ideas/RE-019-theme-token-color-cache.md)
- [RE-012 — Pipeline Observability Hooks](../cool-ideas/RE_012-pipeline-observability-hooks.md)

Already-landed adjacent work:

- [HT-006 — Allow pages to push notifications in createFramedApp](../../retro/HT-006-page-level-notification-push.md)
