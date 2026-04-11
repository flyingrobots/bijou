# BEARING

## Where Are We Going?

The runtime engine has its performance foundation and the render pipeline
is byte-packed and zero-alloc on the hot path. The framed app render
loop itself is now zero-alloc for header/footer painting.

The next gravity is split between:

- **deepening the product surface** — DOGFOOD story quality, layout
  and viewport formalization, and the i18n catalog loader are all
  waiting behind the engine work
- **making Bijou self-documenting for AI** — the MCP rendering server
  shipped in 4.2.0, and interactive component documentation is next
- **data visualization maturity** — the sparkline/braille/stats/perf
  toolkit shipped in 4.4.0; deeper chart types and interactivity are
  future directions

## What Just Shipped?

### 4.4.0

- [Data visualization toolkit](./releases/4.4.0/whats-new.md): `sparkline()`,
  `brailleChartSurface()`, `statsPanelSurface()`, `perfOverlaySurface()`
- Zero-alloc framed app header/footer, scoped pane scratch pool (RE-010)
- New bench scenarios: flame, component-app (dynamic sizing)
- Soak runner rewritten on `createFramedApp`
- DOGFOOD data-viz stories (36/36 families at 100% coverage)
- Closed stale backlog items for RE-008, RE-007, RE-009, RE-010, RE-015
- [RE-021](./method/backlog/cool-ideas/RE-021-frame-owns-the-pump.md) logged
  as cool idea for next major

### 4.3.0

- [RE-008](./design/0001-008-byte-packed-surface-representation/008-byte-packed-surface-representation.md)
  — byte-packed surface representation (23 commits, 19 slices)
- [RE-017](./perf/RE-017-byte-pipeline.md) — byte-pipeline performance recovery
- RE-015 fix — braille art corruption resolved by packed byte-copy blit
- RE-010 closed — mutable surface caches resolved by packed buffer + dirty bitmap

### 4.2.0

- [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  — framed shell migrated onto runtime engine seams
- `@flyingrobots/bijou-mcp` — MCP rendering server (22 tools)
- Inspector `supportingTextLabel` fix
- DF-022, DF-023, DF-024, DF-025, DF-026 DOGFOOD corpus cycles
- WF-003 smoke migration to DOGFOOD
- METHOD migration (all 7 legends)
- Hardcoded version string purge

### 4.1.0

See [4.1.0 release docs](./releases/4.1.0/whats-new.md).

## What's Next?

- [LX-010](./method/backlog/asap/LX_010-built-in-i18n-catalog-loader.md)
  — built-in i18n catalog loader (ASAP)
- [DF-020](./method/backlog/up-next/DF_020-deepen-dogfood-story-depth-and-variant-quality.md)
  — deepen DOGFOOD story depth
- [DL-009](./method/backlog/up-next/DL_009-formalize-layout-and-viewport-rules.md)
  — formalize layout and viewport rules
- MCP interactive documentation (inbox)
- WritePort byte-level API (inbox)

## What Feels Wrong?

- notification toast hit-testing stays outside the retained layout
  system (viewport-positioned overlays managed by notification.ts)
- `@flyingrobots/bijou-i18n` has no built-in catalog loader — users
  must manually orchestrate the load-parse-register pipeline
- RE-016 (grapheme width for ambiguous-width emoji icons) has no
  universal fix — width depends on rendering context
