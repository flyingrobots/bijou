# Motion, transitions, and graphics

Sources: `packages/bijou-tui/src/animate*.ts`, `spring*.ts`, `timeline*.ts`, `transition-shaders.part0*.ts`,
`raster-*.ts`; `packages/bijou/src/core/viz/`, `packages/bijou/src/ports/surface-*.ts`. Guide:
`docs/guides/declarative-data-viz.md`. Examples: `examples/hero/`, `examples/timeline-anim`, `examples/plot`.

## Motion

Motion must clarify a state change. Static mode shows the truthful final state; pipe drops motion entirely; offer a
reduced-motion path. Spinners and animated progress bars already skip animation outside `interactive`.

- **Pulse:** the runtime sends `PulseMsg { dt }` (seconds) every frame. Time-based model state advances in
  `update` on pulses: `model.time + msg.dt`.
- **`animate({ from, to, onFrame: (v) => Msg, onComplete?, type?: 'spring'|'tween', spring?, duration?, ease?,
  immediate? })`** returns a `Cmd` that emits `onFrame` messages. Springs are the default
  (`SPRING_PRESETS`: `default`, `gentle`, `wobbly`, `stiff`, `slow`, `molasses`); tweens take `duration` (ms) and
  an `EASINGS` curve (`linear`, `easeInOut`, `easeOutCubic`, ...). `immediate: true` jumps to the end in one frame:
  use it outside `interactive`.
- **`timeline()`** sequences named tracks: `.add(name, { from, to, type?, spring? | duration? }, position?)`,
  `.label(name)`, `.call(name, position?)`, `.build()`. Positions: a number, a label, `'<'`, `'+=200'`, `'-=100'`.
  Step it with `timeline.step(state, dt)` and read `timeline.values(state)`.
- **Clock:** time comes from `ctx.clock`; tests inject `mockClock()`.

## Transitions

A transition shader decides, per cell and progress (0 to 1), whether a cell shows the next screen and can override
its character: `(cell: { x, y, width, height, progress, rand, frame, ctx }) => { showNext, overrideChar?,
overrideCell? }`.

- Built-ins (`TRANSITION_SHADERS`, names usable as `transition:` in `createFramedApp`): `none`, `wipe`, `dissolve`,
  `fade`, `grid`, `melt`, `matrix`, `scramble`, `radial`, `diamond`, `spiral`, `blinds`, `curtain`, `pixelate`,
  `typewriter`, `glitch`, `static`.
- Factories: `wipe('left'|'right'|'up'|'down')`, `radial(ox, oy)`, `diamond(ox, oy)`, `spiral(turns)`,
  `curtain()`, `pixelate(max)`, `typewriter(cursor)`, `glitch(intensity)`, `tvStatic(density)`. Combinators:
  `reverse`, `chain`, `overlay`.
- Framed apps: `transition`, `transitionDuration` (ms, default 300), `transitionOverride(model)`,
  `transitionTimeline`.
- Taste: one calm transition used consistently (`dissolve` or `wipe`) reads better than a different effect per
  screen. Keep noisy effects (`glitch`, `static`, `matrix`) for rare, deliberate moments.

## Surfaces

`createSurface(width, height, fill?)` returns a cell grid: `get(x, y)`, `set(x, y, cell)`, `fill(cell, ...)`,
`blit(src, x, y)`, `clone()`, `setRGB(...)`. A cell is `{ char, fg?, bg?, modifiers?, empty }`. Convert text with
`stringToSurface`, `parseAnsiToSurface`, `contentSurface`; render to a string with `surfaceToString(surface, style)`.
Clone a surface before storing it: renderers may reuse one buffer between frames.

## Raster text and glyph art

- `RasterFont({ family, lineHeight, glyphs, fallback? })`, `layoutRasterText(text, font)`, and
  `rasterTextSurface(text, font, { columns, rows, fit, renderer, fg, bg })` draw large lettering.
- Renderers: `{ kind: 'braille' }` (2×4 dots per cell; fine detail, best for small or detailed lettering),
  `{ kind: 'quad' }` (2×2 blocks; solid, best for large titles), `{ kind: 'charset', chars }`.
- `rasterToGlyphSurface(rgba, { columns, rows, fit, renderer, dither, colorMode })` turns any image into cells.

## Data visualization (`@flyingrobots/bijou/viz`)

`plotSurface({ width, height, marks, x?, y?, title?, grid?, legend?, axes? })` with scales `scaleLinear`,
`scaleLog`, `scaleBand`, `scaleOklch(domain, [stopA, stopB])` (exactly two stops). Canvases: `BrailleCanvas`
(`plotDot`, `plotLine`, `fillColumn`, `flushToSurface`) and `HalfBlockCanvas`. Also `heatmapSurface`,
`flamegraphSurface`, `forceGraphSurface`, `computeHdrHistogram`. Pipe lowers a chart to TSV stats; accessible speaks
the title, axes, and each series' range and latest value. Use a table instead when exact values matter.
