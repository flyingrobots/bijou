---
title: DL-028 Declarative Terminal Plot and Sub-Cell Grammar
lane: roadmap
priority: high
github_issue: 520
status: active
keywords:
  - design-language
  - data-viz
  - plot
  - scales
  - braille
  - oklch
  - packed-surface
  - v9.0.0
---

# Declarative Terminal Plot and Sub-Cell Grammar

## Linked Work

- Existing data-viz primitives: `packages/bijou/src/core/components/sparkline.ts`, `braille-chart.ts`, `stats-panel.ts`, `perf-overlay.ts`
- Data-viz behavioral specification: `docs/specs/data-viz.spec.json`
- Perceptual colour floor: [DL-027](./DL-027-sapphire-noir-first-party-palette.md) (`rgbToOklch`, `gamutRelativeOklch`, `interpolateHue`)
- Packed surface contract: `packages/bijou/src/ports/surface-contract.ts` (`PackedSurface.setRGB`)

## Sponsors

- **Human:** James Ross — bring a D3.js-like composable visualization API to the terminal, rendered through Bijou's `PackedSurface` and Unicode Braille (`2x4`) / fractional blocks (`1x8`) where sub-cell fidelity matters.
- **Agent:** Agy — separate what makes D3 timeless (`d3-scale`, `d3-shape`, and Observable Plot's declarative mark composition) from what belongs in a browser DOM (`d3-selection`), and anchor the implementation directly inside `@flyingrobots/bijou` (`@flyingrobots/bijou/viz`).

## Decision Summary

Bijou adopts a three-layer **Grammar of the Grid** inside `@flyingrobots/bijou` (`packages/bijou/src/core/viz/`, exported both from `@flyingrobots/bijou` and the `@flyingrobots/bijou/viz` subpath):

1. **Layer 1: Pure Composable Scales (`scaleLinear`, `scaleLog`, `scaleBand`, `scaleOklch`)** — stateless mathematical functions mapping data domains to sub-cell coordinates or perceptual OKLCH colours, with `.nice()` tick rounding, `.ticks()`, `.invert()`, and zero-division guards.
2. **Layer 2: Push-Based Sub-Cell Rasterizer (`BrailleCanvas`)** — a pre-allocated `Uint8Array` (`2W x 4H` Unicode `U+2800..U+28FF` dot masks) and `Int16Array` per-cell RGB buffer with Liang–Barsky viewport segment clipping, integer Bresenham `plotLine`, `plotDot`, `fillColumn`, and `flushToSurface()` via `PackedSurface.setRGB()`. Once constructed, `BrailleCanvas` performs zero heap allocations per pixel write.
3. **Layer 3: Declarative Mark Composition (`plot`, `plotSurface`, `lineY`, `areaY`, `dot`, `barY`, `ruleY`, `ruleX`)** — an Observable Plot-style compositor that normalizes mark points (allocating a per-mark point array and cloning supplied scales per render), separates **1x1 character-cell typography** in outer margins from **2x4 / 1x8 sub-cell geometry** inside the inner plot viewport, and automatically lowers into exact-number TSV (`pipe` mode) or screen-reader summaries (`accessible` mode).

```text
Domain Data (T[] | number[])
  -> Scales (scaleLinear / scaleLog / scaleBand / scaleOklch)
  -> Declarative Marks (lineY, areaY, dot, barY, ruleY, ruleX)
  -> Sub-Cell Rasterizer (BrailleCanvas 2W x 4H + 1x8 Fractional Blocks)
  -> 1x1 Cell-Aligned Margins (Axes, Ticks, Labels, Legend)
  -> PackedSurface (10-byte cells via setRGB) / Mode Lowering (pipe | accessible)
```

## Package Boundary Decision: Why `@flyingrobots/bijou` (`./viz`) Instead of `packages/bijou-data-viz`

Creating an eleventh workspace package `packages/bijou-data-viz` was evaluated and rejected. The pure declarative plotting grammar belongs in `packages/bijou` (`packages/bijou/src/core/viz/`, exposed at `@flyingrobots/bijou` and `@flyingrobots/bijou/viz`) for four concrete reasons:

| Criterion | `packages/bijou` (`./viz` subpath + barrel) | Separate `packages/bijou-data-viz` |
| --- | --- | --- |
| **Dependency Footprint** | Zero external dependencies; consumes `PackedSurface`, `oklchToRgb`, `interpolateHue`, `resolveSafeCtx`, and `surfaceToString` already inside `packages/bijou`. | Would depend on `@flyingrobots/bijou` anyway, adding a package boundary with zero dependency isolation. |
| **Existing Monorepo Precedent (`dag` vs `dagPane`)** | Matches Bijou's established split: pure renderers (`dag`, `sparkline`, `brailleChartSurface`, `statsPanelSurface`) live in `@flyingrobots/bijou`; stateful TEA pan/zoom controllers (`dagPane`) live in `@flyingrobots/bijou-tui`. | Breaks the split by forcing static CLI/report callers to install a separate package just to render a chart. |
| **Mode Lowering Contract** | Directly participates in `@flyingrobots/bijou`'s core charter: graceful lowering across `interactive`, `static`, `pipe`, and `accessible` modes via `BijouContext`. | Duplicates or re-exports `BijouContext` mode-lowering plumbing across packages. |
| **Lock-Step Release Tax** | Zero additional npm publish target, tarball verification step, or `LOCKSTEP_PACKAGES` entry in `scripts/version.mjs`, `scripts/release-metadata.part01.ts`, and `.github/workflows/release-dry-run.yml`. | Permanent 11th-package tax across `tsconfig.json`, `release-dry-run.yml`, `smoke-canaries.ts`, and `CHANGELOG.md` for ~500 LOC of pure TypeScript. |

**Future interactive boundary:** When stateful TEA pan/zoom/crosshair/brush viewports (`plotPane`) are added, they will live in `@flyingrobots/bijou-tui` and call `plotSurface()` from `@flyingrobots/bijou` on each frame—mirroring `dag` (`@flyingrobots/bijou`) and `dagPane` (`@flyingrobots/bijou-tui`).

## Why `d3-selection` Is Rejected in the Terminal

In the browser, `d3.select(svg).selectAll('circle').data(d).join('circle')` exists because the SVG DOM is a retained-mode scene graph of mutable heap objects.

In Bijou:
- The rendering target is `PackedSurface`: a flat, pre-allocated `Uint8Array(width * height * 10)` where each cell packs `[codePoint(2B), fgRGB(3B), bgRGB(3B), flags(1B), alpha(1B)]` into 10 contiguous bytes.
- A retained scene graph of per-point objects for a 100,000-point scatter plot allocates megabytes of short-lived heap nodes every frame, defeating Bijou's zero-allocation render pipeline (`RE-010`) and failing the `100,000`-value requirement in `docs/specs/data-viz.spec.json`.
- Furthermore, in `2x4` Unicode Braille (`U+2800` to `U+28FF`), up to **8 data points share a single terminal character cell** via bitwise OR (`mask |= BRAILLE_DOT_MASKS[dx][dy]`). Because terminal cells cannot hold a tree of child DOM nodes, an immediate-mode **push rasterizer** (`O(D)` over data points, flushing `O(W * H)` cells) is both mathematically cleaner and orders of magnitude faster.

## Architecture

### 1. Sub-Cell vs. Character-Cell Coordinate Split

A common failure mode of terminal plotting libraries is attempting to draw axes and text inside the Braille bitmask or letting Braille dots collide with axis labels. `plotSurface()` enforces a strict coordinate separation:

- **Outer Margins (`1x1` cell grid):** Title, legend pills (`● label`), Y-axis numeric tick labels, the `│` / `└` / `─` axis frame, and X-axis tick labels are placed on exact character cell coordinates.
- **Inner Plot Viewport (`2W x 4H` Braille sub-grid or `1W x 8H` fractional-block grid):** Continuous marks (`lineY`, `areaY`, `dot`, `ruleY`, `ruleX`) project data coordinates into `[0, plotWidth * 2 - 1] x [plotHeight * 4 - 1, 0]` (with Y inverted so higher domain values render at the top of the viewport).

### 2. Scale-Projected Marks, Missing Samples, and Cell Collision Policy

- **Unified Scale Projection (`barY` vs `dot`/`lineY`):** Every mark projects through the supplied `x` and `y` scales. `barY` projects both `pt.y` and its baseline (`y0`, defaulting to `0` when inside a linear domain or `d0` for positive/logarithmic domains) through `yScale`, so signed bars draw downward from `0` and logarithmic bars align to the exact cell row of a `dot` at the same value.
- **Explicit Missing Data (`NaN` & `defined`):** Invalid or omitted samples (`NaN`, `undefined`, or `defined(d, i) === false`) remain `NaN` rather than coercing to `0`. `lineY` and `areaY` break their polylines/fills across `NaN` samples to render genuine gaps, and domain inference / `pipe` / `accessible` summaries ignore non-finite samples.
- **Cell Collision & Mark-Order Policy:** Within a contiguous Braille pass, up to 8 dots in the same character cell OR their bitmasks (`mask |= BRAILLE_DOT_MASKS[dx][dy]`) and the latest colored write sets the cell's foreground RGB. Between `1x8` fractional block marks (`barY`) and `2x4` Braille marks, `plotSurface()` flushes and clears `BrailleCanvas` before each `barY` mark so `options.marks` array order deterministically controls which layer overwrites overlapping cells.
- **Viewport Clipping:** `BrailleCanvas.plotLine()` clips segments to `[0, pixelWidth - 1] x [0, pixelHeight - 1]` via Liang–Barsky before walking Bresenham, and `areaY` clamps horizontal column spans to the visible viewport so extreme outliers never cause unbounded offscreen raster work.

### 3. Graceful Mode Lowering (`interactive`, `static`, `pipe`, `accessible`)

`plot(options)` inspects `ctx?.mode`:
- **`interactive` / `static`:** Renders `plotSurface(options)` and serializes through `surfaceToString(surface, ctx.style)`.
- **`pipe`:** Emits deterministic tab-separated (`TSV`) summary rows (`series\tcount\tx_min\tx_max\ty_min\ty_max\ty_last`) suitable for `awk`, `cut`, or downstream scripts.
- **`accessible`:** Emits structured natural-language sentences announcing chart title, X/Y domains, and per-series point counts, extrema, and latest values for screen readers.

## Hill

A developer can render a multi-series line, area, scatter, or bar chart into a `PackedSurface` or terminal string in 10 lines of declarative TypeScript using `@flyingrobots/bijou/viz`, with automatic nice ticks, OKLCH colour scales, sub-cell Braille Bresenham lines, 100,000-point `O(D)` throughput, and zero-configuration `pipe` / `accessible` lowering.

## Playback Questions

1. **Human playback:** Can an author write `plot({ width: 60, height: 14, marks: [areaY(cpu), lineY(p95), ruleY(80)] })` and get a legible, properly labelled terminal chart without manual bit-twiddling or array downsampling? **Yes.**
2. **Agent playback:** Can automated tests verify exact scale math (`scale.invert(scale(x)) === x`), Bresenham continuity across Braille cell boundaries, `100,000`-point scatter rendering without stack overflow, and `pipe`/`accessible` output without mocks? **Yes.**

## Tests Written First

- `packages/bijou/src/core/viz/scales.test.ts`:
  - `scaleLinear` forward mapping, `invert()`, clamping, zero-span domain guard (`[5, 5]`), `NaN`/`Infinity` sanitization, `.nice()`, and `.ticks()`.
  - `scaleLog` decade mapping, `invert()`, and non-positive domain/input guards.
  - `scaleBand` categorical positioning, `bandwidth()`, `step()`, and unknown key handling.
  - `scaleOklch` perceptual colour interpolation in OKLCH space.
- `packages/bijou/src/core/viz/plot.test.ts`:
  - `BrailleCanvas` sub-pixel `plotDot`, integer Bresenham `plotLine` continuity across cells, `fillColumn`, and `flushToSurface` RGB fidelity.
  - `plotSurface` multi-mark composition (`lineY`, `areaY`, `dot`, `barY`, `ruleY`, `ruleX`), axis tick labels, and legend rendering.
  - `plot()` mode lowering across `interactive`, `pipe` (TSV), and `accessible` modes.
  - `100,000`-point scatter plot (`dot`) completion in `< 50ms` with bounded memory (`O(D)` time, `O(W * H)` memory).
