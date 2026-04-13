---
title: RE-018 — Hex Color Strings As The Canonical fg/bg Representation
lane: graveyard
---

# RE-018 — Hex Color Strings As The Canonical fg/bg Representation

## Disposition

Retired from `bad-code` on `release/v4.5.0` in commit `69291fa`. This branch fixed the concrete hot-path smell: packed surfaces now preserve `fgRGB` / `bgRGB` through reads and masked writes, first-party surface/TUI components prefer pre-parsed RGB over reparsing strings, and the string path is now much closer to a compatibility boundary than the internal default. The remaining deeper evolution is no longer an immediate defect; track further API-shaping work under `docs/method/backlog/cool-ideas/RE-019-theme-token-color-cache.md` and `docs/BACKLOG/v5.0.0/RE-020-typed-color-representation.md`.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

Throughout the bijou API surface, foreground and background colors
are represented as `'#rrggbb'` strings on the `Cell` interface:

```ts
interface Cell {
  fg?: string;  // '#rrggbb'
  bg?: string;  // '#rrggbb'
  ...
}
```

Every single `surface.set(x, y, { fg, bg, ... })` call has to parse
these strings into bytes before writing to the packed buffer. The
parse happens via `inlineHexRGB` in `packages/bijou/src/ports/surface.ts`
(6 `charCodeAt`s + 6 `hexD` lookups + bit shuffles per color). For
a paint-heavy frame that sets every cell of a 220×58 surface with
both fg and bg, that's **25,520 hex parses per frame** — and the
theme vocabulary is ~15 unique colors.

24,505 of those parses are wasted work because they recompute the
same bytes over and over for the same theme colors.

## Evidence

- `inlineHexRGB` is called from `encodeCellIntoBuf` at
  `packages/bijou/src/ports/surface.ts:312-321` for every `set()`
  call that provides fg or bg.
- The RE-017 audit showed broad 30-113% regressions across every
  rendering scenario in the bench after RE-008 merged. Paint-heavy
  scenarios (`paint-set-hex-palette`, `surface.paint.medium`, pure
  `dogfood.render.*`) regressed hardest. Paint scenarios that use
  `setRGB` (which takes pre-parsed bytes) are less affected in
  principle, but are still dominated by the paint cost because
  most components still call `surface.set({fg, bg})`.
- Over 25 callsites in `packages/bijou/src/core/components/` import
  `parseHex` and parse theme colors manually — the "fast" path is
  already the exception, not the norm. See
  `packages/bijou/src/core/components/table-v3.ts:87`,
  `preference-list.ts:134`, `surface-text.ts`.

## Why This Is Bad

1. **Repeated work.** The same hex string parses to the same bytes
   every time. There is no state in a hex string; no reason to
   re-parse it.
2. **API boundary at the wrong layer.** Hex strings are a *user
   input* format. They belong at the edge of the system where a
   human types `#ff8800` into a theme file. They do not belong in
   the hot path that runs thousands of times per frame.
3. **Encourages callers to bypass the safe API.** Components have
   already started caching their own parsed bytes to avoid the
   overhead (`preference-list.ts` caches `parseHex` results in
   locals). This is a smell — it means the safe API is too slow to
   use safely, so callers build their own shortcuts.

## Fix Direction

Two options that compose:

1. **Theme-token color cache.** When a theme is loaded, pre-parse
   every hex color into a `Uint8Array` (3 bytes). Expose a resolved
   theme that holds bytes, not strings. Components that pull colors
   from theme tokens get pre-parsed bytes for free. See the related
   cool idea `RE-019-theme-token-color-cache.md`.

2. **Typed color representation at the API boundary.** Introduce a
   branded `ColorRef` type (an opaque wrapper around a packed uint32
   or a `Uint8Array`) and make `Cell.fg`/`Cell.bg` accept
   `ColorRef | string`. Hex strings stay supported for human-written
   code, but library internals and components thread `ColorRef` end
   to end. Hex parsing happens only at the string → ColorRef
   boundary, once. See cool idea
   `RE-020-typed-color-representation.md`.

Both preserve API compatibility for user code while making the hot
path allocation-free.

## Impact

Measuring against the RE-017 post-merge baseline:

- `paint-set-hex-palette` at 220×58: 634 µs/frame, 12,760 cells, ~2
  hex parses per cell (fg + bg). Roughly ~25,000 parses / frame.
- If each parse is ~200 ns (conservative), that's 5 ms of parse
  work per frame, dwarfing the 634 µs total. But the actual parse
  cost is much lower (maybe 20-50 ns each), making total parse cost
  ~500 µs-1 ms per frame — still a significant fraction of frame
  time on paint-heavy workloads.

Confirming the magnitude is a task in RE-017 (I-0e). This entry
captures the structural smell regardless of the exact number.

## Tests To Add

- Paint scenario that exercises `surface.set({fg, bg})` with a
  small fixed palette — confirms the per-cell parse cost.
- Equivalent scenario using `setRGB` with pre-parsed bytes —
  establishes the theoretical floor.
- Property test: `surface.set({fg: theme.primary})` should not
  allocate new strings on the hot path (heap snapshot diff).
