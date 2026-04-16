---
title: RE-020 — Typed Color Representation (`ColorRef` Branded Type)
lane: retro
legend: RE
---

# RE-020 — Typed Color Representation (`ColorRef` Branded Type)

## Disposition

Implemented on `release/v5.0.0` as a compatibility-first `ColorRef` landing.
`Cell.fg` / `Cell.bg` now accept `ColorRef`, the runtime exports
`ResolvedColor`, `resolveColor()`, `tryResolveColor()`, `colorHex()`, and
`colorRgb()`, and packed surface writes can consume either user-authored hex
strings or eager resolved color objects without reparsing on the hot path.
Theme-token byte caching from RE-019 remains the automatic fast path, while
components and adapters can now thread typed resolved colors through paint and
output code explicitly.

## Original Proposal

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

Replace raw `fg?: string` / `bg?: string` in `Cell` (and everywhere
downstream) with a branded `ColorRef` type that can be either a
string (for user code) or a pre-parsed byte representation (for
internal hot paths):

```ts
/**
 * Opaque color reference. Either a user-written hex string
 * (lazy; parsed on first use) or a pre-resolved bytes object
 * (eager; zero parse cost on the hot path).
 */
export type ColorRef = string & { readonly __color: unique symbol }
                     | ResolvedColor;

export interface ResolvedColor {
  readonly __color: unique symbol;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function color(hex: string): ColorRef {
  return hex as ColorRef;  // lazy
}

export function resolveColor(ref: ColorRef): ResolvedColor {
  if (typeof ref === 'string') {
    const [r, g, b] = parseHex(ref)!;
    return { __color: undefined as never, r, g, b };
  }
  return ref;
}
```

Cell becomes:

```ts
interface Cell {
  fg?: ColorRef;
  bg?: ColorRef;
  // ...
}
```

`surface.set()` handles both branches: if the color is a
`ResolvedColor`, write bytes directly; if it's a string, parse
inline (same as today).

Theme resolution pre-produces `ResolvedColor` objects for every
token color (see related idea `RE-019-theme-token-color-cache.md`),
so hot-path components automatically get the fast path by virtue
of pulling from the theme.

## Why

Hex strings are a **user input format** — great for humans typing
`#ff8800` into a theme JSON or calling a styling API ad-hoc. But
they're a terrible internal representation because they force a
parse on every use. Today, `fg: '#rrggbb'` in Cell forces that
parse to happen per-cell, per-frame, in the hottest loop in the
system.

`ColorRef` lets us keep hex strings for ergonomic user code while
threading a parsed representation through the hot path. The type
system makes it clear which layer you're at.
