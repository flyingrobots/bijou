# RE-008 — Rendering Performance Findings

_Results from the `examples/perf-gradient` stress test, April 2026.
These findings motivate [RE-008 — Byte-Packed Surface Representation](../BACKLOG/asap/RE-008-byte-packed-surface-representation.md)._

## Test setup

- Terminal: iTerm2, 191×48 (9,168 cells)
- Runtime: Node.js v25.8.1, tsx
- Hardware: Apple Silicon Mac
- Modes tested: cosine gradient (unique fg+bg per cell), ASCII
  perspective horizon (varying chars, few color changes), OpenSimplex
  noise density (varying chars, single bg), quad (all three combined)

## Raw numbers

| Mode | FPS (capped) | FPS (uncapped, cold) | FPS (uncapped, warm) | view() ms | ft ms (actual) |
|------|-------------|---------------------|---------------------|-----------|----------------|
| Gradient | 49 | 30-49 | 158 | 2.5 | ~20 |
| Horizon | 60 | 344 | 344 | 1.4 | ~3 |
| Noise | 49-60 | 98 | 298 | 1.4-1.5 | ~3-10 |
| Quad | 60 | 91 | 91 | 1.3 | ~11 |

"Warm" means after 60+ seconds of sustained rendering, when V8 has
JIT-compiled the hot paths and GC has settled.

## Where frame time goes

At 191×48 with the gradient (worst case), a frame takes ~20ms total:

| Phase | Time | Measurable from app? |
|-------|------|---------------------|
| update() | ~0ms | yes |
| view() (gradient math + surface.set) | ~2.5ms | yes |
| Pipeline: diff + ANSI encode + stdout.write | ~17.5ms | **no** |

**92% of frame time is spent in bijou's render pipeline, not in the
app's view function.** The pipeline is not observable from the app
side — there are no hooks to measure diff, paint, or output phases
individually.

## The differ is the bottleneck

The differ (`packages/bijou/src/core/render/differ.ts`) compares every
cell in the target surface against the current surface. For cells that
changed, it emits ANSI escape sequences.

The differ's performance depends on **how many unique styles appear in
sequence**:

- **Horizon (344fps uncapped)**: most cells on a row share the same
  fg/bg, so the differ batches long runs of same-styled characters
  into single ANSI writes. Very few color change escape sequences
  per frame.
- **Noise (298fps uncapped)**: every cell has a unique fg but all
  share `bg: '#000000'`. The differ still emits per-cell fg changes
  but saves half the escape sequences (no bg changes).
- **Gradient (158fps uncapped)**: every cell has a unique fg AND bg.
  The differ emits ~9,168 color change escape sequences per frame —
  one per cell. No batching is possible.

The differ also compares cells by **string equality** on `fg` and `bg`
hex strings (`targetCell.fg === currentCell.fg`), which is correct
but slower than numeric comparison would be.

## Allocation pressure and GC

Each `surface.set()` call in the gradient mode produces 2 hex color
strings (`rgbHex(r, g, b)` for fg and bg). At 9,168 cells per frame,
that is **18,336 string allocations per frame**.

With surface reuse (the cached surface is not reallocated per frame),
the Cell objects themselves are mutated in place via `applyMaskInPlace`.
But the hex color strings are always freshly allocated because they
encode the current frame's computed RGB values.

### GC behavior at different modes

| Mode | Heap (stable) | GC events / 0.5s | Notes |
|------|--------------|-------------------|-------|
| Gradient (capped 60fps) | 51-92 MB | 2-5 | Young-gen fills with hex strings |
| Gradient (uncapped) | 185-824 MB | 0-1 | Heap grows until major GC; V8 eventually stabilizes |
| Noise (uncapped) | 101 MB | 0-1 | Fewer unique strings; V8 handles it |

### JIT warmup

The gradient mode shows a clear warmup curve:

- **0-30 seconds**: 30-49fps. V8 is interpreting; GC is aggressive.
- **30-60 seconds**: 80-120fps. JIT compilation kicks in.
- **60+ seconds**: 150-160fps. Hot paths fully optimized, GC settled.

The noise and horizon modes warm up faster because they produce fewer
unique string values per frame.

## What RE-008 would fix

A byte-packed surface representation would eliminate:

1. **18K string allocations per frame** — colors stored as 3 bytes
   (R, G, B), not heap-allocated hex strings.
2. **String comparison in the differ** — numeric comparison of bytes
   instead of `===` on strings.
3. **Hex parsing in the ANSI encoder** — the `style.styled()` call
   currently parses `#rrggbb` back to numeric RGB to emit
   `\x1b[38;2;R;G;Bm`. With byte-packed cells, the encoder reads
   bytes directly.
4. **The JIT warmup penalty** — no string-heavy hot paths for V8 to
   deoptimize and recompile.

## What DX-006 would provide

A first-class `debugOverlay()` component would let any bijou-tui app
see these metrics without rebuilding the stats overlay from scratch.
The perf gradient demo proves the concept; DX-006 extracts it into
a reusable component.

## Pipeline observability gap

The render pipeline (Layout → Paint → PostProcess → Diff → Output) is
not observable from the app side. `configurePipeline` can add middleware
but only appends after the default stages — it cannot wrap them for
timing. A future improvement would expose per-stage timing hooks so
the debug overlay can show the full breakdown.

## Reproducing

```bash
npx tsx examples/perf-gradient/main.ts
```

Keys: `1-4` switch modes, `space` toggles 60fps cap, hold mouse to
reverse, `q` to quit. The stats overlay shows FPS, frame time, view
time, heap/RSS/GC, and a braille line chart of view() cost.
