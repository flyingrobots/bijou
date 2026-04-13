---
title: RE-019 — Pre-Parse Theme Token Colors Into Bytes
lane: retro
legend: RE
---

# RE-019 — Pre-Parse Theme Token Colors Into Bytes

## Disposition

Completed on `release/v4.5.0`. Theme resolution now preserves and caches
pre-parsed `fgRGB` / `bgRGB` bytes through the live `TokenGraph` path instead
of dropping them after `createResolved()`. Accessor-returned tokens from
`ctx.semantic()`, `ctx.surface()`, `ctx.border()`, `ctx.status()`, and
`ctx.ui()` now carry reusable RGB bytes, live `tokenGraph.set()` / `import()`
updates repopulate those bytes, and repeated token reads reuse cached per-hex
and per-token resolution instead of reparsing the same theme colors in hot
render paths.

## Original Proposal

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

When a theme is loaded, walk all its token values and pre-parse
every hex color (`'#rrggbb'`) into a reusable 3-byte representation.
Expose a resolved theme where each token's color is a `Uint8Array`
of length 3 (R, G, B), not a string.

Then:

- `surface.set({ fg: theme.tokens.primary.fg, bg: ... })` — if the
  color value is already bytes, skip `inlineHexRGB` entirely and
  write straight to the packed buffer.
- Components that need RGB values for other reasons (gradient
  interpolation, contrast checks) get them for free without
  parsing.

The theme stays user-authored as hex strings (human-friendly,
DTCG-interop-friendly), but at runtime the system works in bytes.

## Why

Per the related bad-code entry
`RE-018-hex-color-string-as-canonical-fg-bg.md`, every
`surface.set({ fg: '#xxxxxx' })` currently hex-parses the string
inline. In a paint-heavy frame, that's thousands of redundant
parses — the same theme colors get parsed over and over. The
theme token set is bounded and small (~15-50 unique colors);
parsing them once at theme load time and reusing the bytes
eliminates the hot-path parse cost for all theme-driven paints.

## Scope / Shape

```ts
// core/theme/resolve.ts additions

interface ResolvedToken {
  // existing fields...
  fgBytes?: Uint8Array;  // pre-parsed, 3 bytes [R, G, B]
  bgBytes?: Uint8Array;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  // walk tokens, call parseHex once per unique color, store bytes
}
```

`surface.set()` gains a fast path: if the `fg` field is a
`Uint8Array`, skip `inlineHexRGB` and copy directly. Similarly
for `bg`. Type union: `fg?: string | Uint8Array`.

Optional next step: bake a `ColorRef` branded type over the bytes
so the API doesn't expose raw `Uint8Array` to users. See the
related cool idea `RE-020-typed-color-representation.md`.

## Why This Is Cool

1. **Zero risk to the public API.** Hex strings still work. This
   is purely an optimization under the hood.
2. **Self-healing.** Any code that already uses theme tokens
   benefits automatically; no caller rewrites.
3. **Measurable.** The RE-017 bench has a `paint-set-hex-palette`
   scenario designed exactly to measure this. We can land the
   change and see the impact in a single bench run.
4. **Composable with RE-017's byte-pipeline work.** This removes
   hex parsing from the paint path; II-4 removes string work from
   the diff path. Together they close the loop on "zero string
   allocation during rendering".

## Prior Questions

- Does the resolver need to know about gradients? (DTCG gradient
  tokens have arrays of stops — each stop needs byte-resolving.)
- Should the cache be per-theme or global? (Per-theme is safer
  since theme reload should invalidate.)
- Should we export the byte form publicly, or keep it internal?
  (Start internal; promote later if users want it.)

## Related

- `RE-018` (bad-code) — the hex string parsing smell this fixes.
- `RE-017` / `docs/perf/RE-017-byte-pipeline.md` — the cycle where
  this would be measured and landed.
- `RE-020` (cool idea) — `ColorRef` typed representation, a
  follow-on that bakes this into the public API.
