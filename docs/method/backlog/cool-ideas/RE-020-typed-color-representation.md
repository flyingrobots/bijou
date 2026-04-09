# RE-020 — Typed Color Representation (`ColorRef` Branded Type)

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

## Migration Path

1. Land `RE-019-theme-token-color-cache.md` first — that's the
   cheap no-breaking-changes version.
2. Add `ColorRef` as a type alias that's currently just `string`,
   update Cell to use it. This is a rename, no runtime change.
3. Add a `ResolvedColor` case to the union. Update `surface.set`
   to handle it.
4. Update theme resolver to produce `ResolvedColor` objects.
5. Components that build cells directly (not via theme tokens)
   can opt in by calling `resolveColor(hex)` once at setup time
   and reusing the result.
6. Eventually, `string` is still valid for user code but
   components use `ResolvedColor` internally.

No breaking changes at any step.

## Why This Is Cool

- **Ergonomic at the edge, fast at the core.** The right
  abstraction at the right layer.
- **Type-directed optimization.** The type system tells you when
  you're on the slow path vs the fast path.
- **Composable with other optimizations.** Gradients can store
  `ResolvedColor` stops, animations can interpolate in byte space
  without string conversions.
- **Pairs with the RE-017 byte pipeline.** The byte pipeline
  eliminates string work from the diff path; this eliminates string
  work from the paint path. Together they close the loop.

## Related

- `RE-018` (bad-code) — the hex string smell.
- `RE-019` (cool idea) — the simpler precursor: theme-token byte
  cache without exposing a new type.
- DTCG interop at `packages/bijou/src/core/theme/dtcg.ts` — this
  must continue to round-trip to hex strings for export.
