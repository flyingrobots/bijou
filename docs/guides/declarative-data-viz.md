# Declarative Terminal Data Visualization (`@flyingrobots/bijou/viz`)

Bijou provides a D3 / Observable Plot-inspired declarative visualization toolkit in `@flyingrobots/bijou/viz` (also re-exported from the root `@flyingrobots/bijou` package). It combines composable mathematical scales, a push-based `2x4` Unicode Braille rasterizer (`BrailleCanvas`), fractional `1x8` block bars, perceptual OKLCH colour scales, and automatic mode lowering for `pipe` and `accessible` environments.

## Architectural Overview

Unlike browser libraries that mutate a retained SVG DOM (`d3-selection`), Bijou's visualization pipeline is immediate-mode: `plotSurface()` normalizes marks and clones viewport scales per render, while `BrailleCanvas` rasterizes sub-pixels into pre-allocated typed arrays with zero per-pixel heap allocations:

1. **Scales (`scaleLinear`, `scaleLog`, `scaleBand`, `scaleOklch`)** map arbitrary domain values into sub-cell pixel coordinates or perceptual OKLCH colours.
2. **Sub-Cell Rasterizer (`BrailleCanvas`)** projects points, Bresenham lines, and vertical area spans onto a `2W x 4H` sub-pixel dot buffer and flushes directly into a `PackedSurface` via `setRGB()`.
3. **Declarative Marks & `plot()` / `plotSurface()`** compose multiple series (`lineY`, `areaY`, `dot`, `barY`, `ruleY`, `ruleX`) inside cell-aligned `1x1` margins for titles, legends, axes, and tick labels.

## Quick Start

```ts
import {
  plot,
  plotSurface,
   areaY,
  lineY,
  ruleY,
  scaleLinear,
} from '@flyingrobots/bijou/viz';

const latencyP50 = [18, 21, 19, 24, 28, 26, 22, 20, 19, 23, 25, 21];
const latencyP99 = [42, 49, 45, 68, 84, 76, 59, 51, 48, 62, 71, 54];

// Render a styled terminal string (automatically lowers in pipe/accessible modes):
const output = plot({
  title: 'API Latency (ms)',
  width: 56,
  height: 12,
  grid: true,
  legend: true,
  y: scaleLinear([0, 100]).nice(),
  marks: [
    areaY(latencyP50, { label: 'p50', stroke: '#38bdf8' }),
    lineY(latencyP99, { label: 'p99', stroke: '#f43f5e' }),
    ruleY(75, { label: 'SLO', stroke: '#f59e0b' }),
  ],
});

console.log(output);
```

When building interactive `@flyingrobots/bijou-tui` applications, call `plotSurface(options)` to obtain a `PackedSurface` that can be blitted directly into a layout node or viewport pane.

## Composable Scales

### `scaleLinear(domain?, range?)`

Maps a continuous numeric `[d0, d1]` domain to `[r0, r1]`.

- `.domain([min, max])` / `.range([r0, r1])`
- `.clamp(true)` — clamps out-of-bounds inputs to the target range.
- `.nice(count?)` — expands the domain to clean $10^k \times \{1, 2, 5, 10\}$ boundaries.
- `.ticks(count?)` — generates human-readable tick values across the domain.
- `.invert(y)` — maps a range coordinate back into domain space (ideal for terminal mouse/cursor hover inspection).

### `scaleLog(domain?, range?, base?)`

Logarithmic continuous scale for exponential metrics (latency tails, byte sizes, frequency spectra). Safely guards against non-positive inputs.

### `scaleBand(domain?, range?, padding?)`

Maps discrete categorical keys (`readonly string[]`) to uniform horizontal bands with configurable inter-band padding (`0..0.9`). Expose `.bandwidth()` and `.step()`.

### `scaleOklch(domain?, stops?)`

Interpolates colours across a numeric domain in perceptual **OKLCH** space (`l`, `c`, `h`) via Bijou's perceptual colour engine (`interpolateHue`, `oklchToRgb`), preventing muddy mid-tones across heatmaps and scatter plots.

```ts
import { scaleOklch, dot, plotSurface } from '@flyingrobots/bijou/viz';

const heat = scaleOklch(
  [0, 100],
  [
    { l: 0.62, c: 0.14, h: 250 }, // cool sapphire
    { l: 0.78, c: 0.18, h: 35 },  // warm amber-coral
  ],
);

const sample = heat(75);
// sample.rgb -> [r, g, b], sample.hex -> '#...', sample.oklch -> { l, c, h }
```

## Direct Sub-Cell Drawing with `BrailleCanvas`

For custom high-density visualizations (phase portraits, flame waveforms, particle fields), use `BrailleCanvas` directly:

```ts
import { createSurface } from '@flyingrobots/bijou';
import { BrailleCanvas } from '@flyingrobots/bijou/viz';

const surface = createSurface(40, 12);
const canvas = new BrailleCanvas(40, 12); // 80 x 48 sub-pixels

// Draw a connected Lissajous curve in 2W x 4H sub-cell coordinates:
let prevX = 40;
let prevY = 24;
for (let i = 1; i <= 200; i++) {
  const t = (i / 200) * Math.PI * 2;
  const px = Math.round(39.5 + 36 * Math.sin(3 * t));
  const py = Math.round(23.5 + 21 * Math.sin(4 * t));
  canvas.plotLine(prevX, prevY, px, py, [88, 166, 255]);
  prevX = px;
  prevY = py;
}

canvas.flushToSurface(surface, 0, 0);
```

## Declarative Marks Reference

| Mark | Resolution | Purpose |
| --- | --- | --- |
| `lineY(data, options?)` | `2x4` Braille (`U+2800..U+28FF`) | Connected polyline with Liang–Barsky viewport clipping; breaks cleanly across `NaN` / `defined: false` gaps. |
| `areaY(data, options?)` | `2x4` Braille (`U+2800..U+28FF`) | Vertical sub-pixel fill from baseline (`y0`, default `0`) to `y`, breaking across `NaN` gaps. |
| `dot(data, options?)` | `2x4` Braille (`U+2800..U+28FF`) | Scatter plot supporting `O(D)` overplotting and per-point `colorValue` + `colorScale: OklchScale`. |
| `barY(data, options?)` | `1x8` Fractional Block (`▁`..`█`) | Scale-projected bars from baseline `y0` (default `0` in signed linear domains, `d0` in log/positive domains) to `y`. |
| `ruleY(y, options?)` | `2x4` Braille horizontal line | Horizontal threshold / baseline / SLO reference line at domain value `y`. |
| `ruleX(x, options?)` | `2x4` Braille vertical line | Vertical event marker / reference line at domain value `x`. |

### Missing Data, Accessors, and Mark-Order Collision Policy

- **Missing Samples (`NaN` & `defined`):** Non-finite values (`NaN`) or items rejected by `defined: (d, i) => boolean` are preserved as missing rather than coerced to `0`. `lineY` and `areaY` leave a visible gap across missing samples, and `inferPlotDomains`, `pipe`, and `accessible` modes exclude them from min/max/count statistics.
- **Independent Accessors:** `x`, `y`, `colorValue`, and `defined` accessors resolve independently whether input data is `number[]` or `T[]`.
- **Cell Collision Policy:** Within a Braille layer, dots in the same cell OR their `2x4` bitmasks and the latest colored write sets the cell's foreground RGB. Across `barY` (`1x8` block cells) and Braille marks, `plotSurface()` flushes the Braille buffer before each `barY` mark so `options.marks` declaration order determines which mark wins on overlapping cells.
- **Live Telemetry vs. Synthetic Showcase:** Run `npm run btop` for the live host monitor (which records only observed timestamped samples and reports unavailable `vm_stat` metrics as `n/a`), or `npm run plot` (`npm run data-viz`) for the explicitly labeled synthetic latency & Lissajous showcase.

## Graceful Mode Lowering

`plot(options)` adapts automatically to `ctx.mode`:

- **`interactive` / `static`:** Renders the full Unicode Braille + box-drawing chart with truecolor/theme styling.
- **`pipe`:** Emits clean tab-separated (`TSV`) summary statistics (`series`, `count`, `x_min`, `x_max`, `y_min`, `y_max`, `y_last`) with no ANSI escapes.
- **`accessible`:** Emits a structured screen-reader summary describing the chart title, axes domains, and each series' range and latest reading.
