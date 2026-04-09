# What's New in Bijou 4.3.0

## Byte-Packed Surface Rendering (RE-008)

The internal `Surface` data structure is now backed by a packed
`Uint8Array` — 10 bytes per cell instead of heap-allocated JavaScript
objects with string colors.

### What changed

Every cell in a surface is now a contiguous 10-byte sequence:

- **Bytes 0–1**: character code (uint16, with a side table for emoji
  and multi-codepoint grapheme clusters)
- **Bytes 2–4**: foreground R, G, B
- **Bytes 5–7**: background R, G, B
- **Byte 8**: modifier flags bitfield (bold, dim, strikethrough,
  inverse, underline variants)
- **Byte 9**: opacity + fg/bg presence bits

### What this means for performance

The differ now compares cells as 10-byte sequences instead of
string equality on `fg`, `bg`, and `char` properties. Surface
composition (`blit`) copies bytes directly between buffers. `fill()`
and `clear()` use a template-stamp approach. The ANSI output path
emits SGR escape sequences directly from buffer bytes with a cached
style lookup — bypassing chalk entirely.

**DOGFOOD landing render+diff: 7% faster** than the pre-RE-008
baseline, with zero regressions on any real-world scenario.

### The `setRGB()` API

A new `Surface.setRGB()` method writes character code + numeric RGB
values directly into the packed buffer with zero string parsing and
zero object allocation. It's roughly 10–50x faster than `set()` for
per-cell writes.

```ts
// Before (allocates Cell object, parses hex strings)
surface.set(x, y, { char: '█', fg: '#ff8800', bg: '#000000' });

// After (zero-alloc — writes bytes directly)
surface.setRGB(x, y, 0x2588, 255, 136, 0, 0, 0, 0);
```

All built-in components use `setRGB` automatically when the surface
is packed. The `set()` convenience API is preserved and documented.

### Numeric theme tokens

`TokenValue` now carries optional `fgRGB` and `bgRGB` fields with
pre-parsed numeric RGB channels. These are populated automatically at
theme resolution time, enabling components to skip hex parsing when
writing styled cells.

## Braille Rendering Fix (RE-015)

`flexSurface` with `align: 'center'` no longer corrupts braille
characters (U+2800–U+28FF). The packed byte-copy blit preserves all
character codes directly without intermediate string processing.
Verified with a 420×140 (58,800 cell) braille art test case — zero
mismatches.

## New Exports

- **`PackedSurface` interface** — extends `Surface` with `.buffer`,
  `.sideTable`, and `.markAllDirty()`
- **`@flyingrobots/bijou/perf`** — subpath export for packed-cell
  utilities (`parseHex`, `encodeModifiers`, flag constants)
- **Modifier flag constants** — `FLAG_BOLD`, `FLAG_DIM`,
  `FLAG_STRIKETHROUGH`, `FLAG_INVERSE`, `UNDERLINE_SOLID`, etc.

## Resolved Backlog Items

- **RE-010 (mutable surface caches)** — resolved by the packed buffer
  with lazy dirty bitmap
- **RE-015 (braille corruption)** — resolved by byte-copy blit

## Package Map

All 10 workspace packages are versioned together at `4.3.0`.
No new packages in this release.
