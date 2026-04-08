# RE-008 — Byte-Packed Surface Representation

Source backlog item: `docs/method/backlog/asap/RE_008-byte-packed-surface-representation.md`
Legend: RE

## Sponsors

- Human: James
- Agent: Claude (Opus 4.6)

## Hill

Surface rendering in Bijou goes from "every cell is a heap-allocated
object with string colors" to "every cell is 10 bytes in a flat typed
array with numeric RGB." The DOGFOOD landing benchmark is at parity or
faster than the pre-RE-008 baseline, and the architecture enables
zero-allocation rendering for any component that opts into `setRGB()`.

## Playback Questions

### Human

- [x] Does the DOGFOOD landing render at least as fast as before?
- [x] Are all 2816 existing tests still passing?
- [x] Is the `set()` convenience API preserved and documented?
- [x] Can components opt into the fast path incrementally?

### Agent

- [x] Is the packed buffer the source of truth, with Cell[] as lazy decode?
- [x] Does the differ operate on bytes, not strings?
- [x] Does blit copy bytes directly between packed buffers?
- [x] Are side-table chars (emoji, grapheme clusters) handled correctly?

## What Shipped

### Architecture

- **Packed cell encoding** (`packed-cell.ts`): 10-byte layout per cell —
  uint16 char, 3B fg RGB, 3B bg RGB, 1B flags bitfield, 1B alpha/presence.
  Side table for multi-codepoint graphemes outside the BMP.
- **Lazy dirty bitmap**: `Uint32Array` bitmap (1 bit per cell) tracks which
  cells need decoding from the buffer. Writes mark dirty; reads decode on
  demand.
- **`setRGB()` API**: Zero-allocation writes — char code + numeric RGB
  directly into the buffer. No hex parsing, no Cell object.
- **Packed blit**: 10-byte memcpy per cell with side-table re-encoding for
  cross-surface grapheme clusters.
- **Template-stamp fill/clear**: Encode once, copy bytes to every position.
- **Direct ANSI emission**: Differ reads RGB bytes from the buffer and emits
  `\x1b[38;2;R;G;Bm` directly, with a style-byte hash cache. Bypasses
  chalk and StylePort entirely on the hot diff path.
- **Numeric theme tokens**: `TokenValue.fgRGB` / `bgRGB` pre-parsed at
  theme resolution time.

### Slices (19 commits)

1. Packed-cell byte encoding module
2. `createSurface` backed by `Uint8Array` + eager sync
3. Route all direct cell mutations through `surface.set()`
4. Packed byte-comparison differ
5. Grayscale middleware on packed bytes
6. Lazy dirty bitmap (replace eager sync)
7. Zero-alloc hex parsing (charCode arithmetic, lookup table)
8. Inline hex→RGB, FULL_MASK fast path, numeric theme tokens
9. Direct ANSI SGR emission with cached style-byte hash
10. `setRGB()` API + perf-gradient demo migration
11. Packed byte-copy blit
12. Template-stamp fill, clear, clone
13. Component migration: surface-text, box-v3, separator-v3
14. Component migration: overlay dim, flex/overlay bg inheritance
15. Component migration: table-v3, alert-v3
16. Component migration: notification, css/text-style
17. Component migration: badge, focus-area, preference-list, canvas, differ

### Benchmark Results

| Scenario | Main baseline | RE-008 | Delta |
|----------|--------------|--------|-------|
| Landing render 220×58 | 1.60 ms | 1.55 ms | **-3%** |
| Landing render+diff 220×58 | 1.86 ms | 1.74 ms | **-7%** |
| Landing render 271×71 | 0.53 ms | 0.51 ms | **-3%** |
| Frame compose | 0.95 ms | 1.19 ms | +25% |
| Layout normalize | 0.16 ms | 0.34 ms | +113% |
| Styled diff | 0.42 ms | 0.53 ms | +26% |
| Runtime noop pulses | 0.002 ms | 0.002 ms | **-9%** |

Real-world DOGFOOD rendering is faster. Synthetic stress tests still
show overhead from the `set()` hex-parsing path — these will improve
as more rendering paths move to direct byte manipulation.

## Accessibility and Assistive Reading

No user-facing changes. The packed buffer is internal; all public APIs
return the same Cell objects and string output as before.

## Localization and Directionality

No changes. Character encoding handles the full Unicode BMP directly
and uses a side table for astral/multi-codepoint graphemes.

## Agent Inspectability and Explainability

The `PackedSurface` interface and `setRGB()` API are exported and
documented. Agents can query surface dimensions, read cells via
`get()`, and use the packed buffer for performance-sensitive rendering.

## Non-goals

- Changing the public Cell interface or breaking component APIs
- Removing hex color support from the convenience `set()` API
- Pre-allocated output buffer for stdout (deferred to future work)
- Eliminating the Cell[] layer entirely (the lazy decode + dirty bitmap
  keeps backward compatibility with minimal overhead)
