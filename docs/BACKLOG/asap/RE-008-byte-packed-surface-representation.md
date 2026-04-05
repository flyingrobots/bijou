# RE-008 — Byte-Packed Surface Representation

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Problem

`Surface` was introduced to move bijou away from raw ANSI strings, but
its internal `Cell` type still uses heap-allocated strings for color:

```typescript
interface Cell {
  char: string;
  fg?: string;   // '#ff8800'
  bg?: string;   // '#002244'
  modifiers?: string[];
  empty?: boolean;
  opacity?: number;
}
```

Every `surface.set()` call in the hot path allocates at least two
strings (fg, bg hex). At 191×48 (a normal terminal), that is 18,336
string allocations per frame. The renderer then parses those strings
back to numeric RGB to emit ANSI escapes. The abstraction moved the
API away from strings without moving the data away from strings.

## Why this matters

- The gradient performance stress test (`examples/perf-gradient`) shows
  GC-driven frame drops after sustained rendering because the young
  generation fills with short-lived hex strings
- `createSurface` allocates `width × height` Cell objects per call;
  even with surface reuse, the cell objects themselves are GC-visible
  heap allocations
- The diff renderer (`differ.ts`) compares cells by string equality on
  `fg`/`bg`, which is correct but slower than numeric comparison
- Every middleware in the render pipeline (grayscale, etc.) parses hex
  strings to manipulate color, then re-encodes to hex strings

## Desired outcome

The internal surface representation becomes a flat typed array:

```
Per cell: 8 bytes (or 12 with extended char support)
  [0]      char code point (or index into side table for multi-codepoint graphemes)
  [1-3]    fg R, G, B
  [4-6]    bg R, G, B
  [7]      flags bitfield (empty, bold, dim, underline, italic, strikethrough, inverse, blink)
```

```typescript
// Internal: zero-alloc, GC-invisible
const buffer = new Uint8Array(width * height * CELL_STRIDE);

// Convenience API (allocates, for components that don't need perf)
surface.set(x, y, { char: '█', fg: '#ff8800', bg: '#002244' });

// Hot-path API (zero-alloc)
surface.setRGB(x, y, charCode, fgR, fgG, fgB, bgR, bgG, bgB, flags);
```

The string-based `Cell` interface remains as a convenience layer. The
byte-packed representation is the internal truth. Components opt into
the numeric API for hot paths; everything else continues using the
existing `set(x, y, cell)` API unchanged.

## Non-goals

- Changing the public Cell interface or breaking component APIs
- Removing hex color support from the convenience API
- Unicode grapheme cluster support beyond BMP (side table handles
  multi-codepoint sequences; the common case is single-codepoint)

## Scope

- `packages/bijou/src/ports/surface.ts` — dual representation
- `packages/bijou/src/core/render/differ.ts` — numeric comparison
- `packages/bijou-node/src/io.ts` — direct byte-to-ANSI rendering
- `packages/bijou-tui/src/pipeline/` — numeric middleware path
- All component `render` / `view` functions continue using the
  string API unless explicitly migrated

## Risks

- Multi-codepoint grapheme clusters (emoji, combining marks) don't
  fit in a single byte; need a side table or wider char field
- Opacity (0.0–1.0 float) needs either a byte quantization or a
  separate float array
- The `modifiers` field is currently `string[]`; bitfield encoding
  is a finite vocabulary assumption that must be validated against
  the current modifier set
