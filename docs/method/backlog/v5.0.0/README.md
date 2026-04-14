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
- [**CI-003**](./CI-003-surface-shaders.md) — post-process surface shaders
  for CRT, scanline, and other byte-path effects
- [**RE-014**](./RE_014-buffer-holds-facts-doctrine.md) — lock the
  runtime doctrine around data-first buffers and explicit interpretation
- [**DX-021**](./DX-021-error-surface-post-mortem.md) — render a crash
  surface before alt-screen teardown
- [**DL-010**](./DL-010-strictly-typed-app-examples.md) — keep the docs
  examples strictly typed end to end
- [**DF docs**](./DF_mcp-interactive-documentation-for-all-bijou-components.md) —
  grow MCP docs breadth into a real field guide for first-party components

## Adjacent Work

Recently completed adjacent work:

- [RE-020 — Typed Color Representation](../../retro/RE-020-typed-color-representation.md)
- [RE-019 — Pre-Parse Theme Token Colors Into Bytes](../../retro/RE-019-theme-token-color-cache.md)
- [RE-013 — Memoize Workspace Layout Tree](../../retro/RE_013-memoize-workspace-layout-tree.md)
- [RE-012 — Pipeline Observability Hooks](../../retro/RE_012-pipeline-observability-hooks.md)
- [HT-006 — Allow pages to push notifications in createFramedApp](../../retro/HT-006-page-level-notification-push.md)
