# Hero demo

A 33-second, scripted marketing reel recorded with Bijou's own GIF recorder: no screen capture and no terminal emulator. Every segment is a real Bijou app (DOGFOOD, Block Lab, the Components Library and this hero app), driven by scripted key presses on a mock clock and cut together with Bijou's transition shaders.

```sh
npm run record:hero                  # writes examples/hero/hero.gif at 25 fps
npm run record:hero -- --fps=50      # 50 fps, about twice the size
npm run record:hero -- --stills=2.5,6,10.5   # also writes PNG stills at those seconds
npm run record:modes                 # one UI in all four output modes (PNGs, contact sheet, GIF)
npm run hero                         # run the hero app live; ctrl+p palette, n, [ ], b, q
npm run components                   # Components Library: one component at a time (see examples/components)
```

## What the reel shows

| Time (s) | Segment | What happens |
| --- | --- | --- |
| 0–7 | DOGFOOD | Melts in on the animated Jacquard title; Enter opens the docs, which browse to `alert()` |
| 7–12 | Block Lab | Matrix rain in; walks the 42-story catalog to `modal()` and steps it through static, pipe and accessible |
| 12–21 | Components Library (`npm run components`) | Title screen, the first family's intro slide, Tab through variants, the four output modes, and `i` for info |
| 21–24.6 | Hero dashboard | DAG re-sliced around a new focus each second, live heatmap and flamegraph |
| 24.6–27.4 | Plot grammar | Area, line, rule, bar and OKLCH-coloured dot marks |
| 27.4–33.4 | Render lab | Raytracer in a widening split pane, switched to Braille, perf overlay, palette theme switches |

Every colour comes from a theme of eight OKLCH anchors (`theme.ts`). A theme switch interpolates those anchors in OKLCH over 0.6 s, so the whole screen crossfades perceptually.

### Half-block or Braille

Half-block cells hold two colour pixels. Braille cells hold eight dots but only a foreground and a background colour. The Braille raytracer traces eight sub-pixels per cell, dithers them into a dot mask, and colours the cell with the mean of its lit and unlit dots. That gives sharper edges, but colour still changes per cell. It also traces four times as many rays, so its frame time is roughly three times higher.

## Mode lowering

`modes.ts` renders one release-status UI (alert, table, progress bar, DAG, plot) through each output mode. Nothing in the UI code changes: each component lowers itself. Interactive and static look the same here, because nothing in this UI animates.

## Honest numbers

- **Frame rate.** GIF frame delays are whole centiseconds, so the reachable rates are 50, 33.3 and 25 fps; 60 fps cannot be stored in a GIF. For 60 fps, export video from another tool.
- **Perf overlay.** It shows the measured cost of each `view` call and the frame rate that cost could sustain. It is not the GIF's playback rate.
- **Resources.** A 25 fps take renders in a few seconds and writes about 16 MB. At 50 fps, expect about 1.6 GB of peak RAM and a file about twice the size.

## Files

- `app.ts`: the hero app's scene timeline and view; `app-model.ts`: its state, palette commands and keys.
- `scenes.ts`: title, render lab and palette overlay; `scenes-dashboard.ts`: DAG, heatmap and flamegraph; `scenes-base.ts`: shared panel and text helpers.
- `plot-scene.ts`: the plot-grammar scene.
- `raytracer.ts`: the orbiting-spheres scene in half-block pixels; `raytracer-braille.ts`: the Braille version.
- `transition.ts`: composites two surfaces through any built-in transition shader.
- `theme.ts`: OKLCH theme seeds, interpolation and palette compilation.
- `clip.ts`: records any Bijou app with scripted keys on a mock clock, one frame per pulse.
- `record.ts`: records each app, cuts the reel together, streams the GIF and optional PNG stills.
- `modes.ts`: the mode-lowering shots; `png.ts`: a small PNG encoder for stills.
- `perf.ts`: the perf tracker behind the overlay, which reads memory through a port; `perf-node.ts` is its Node adapter (`process.memoryUsage()`) and `perf-browser.ts` its browser adapter, which reports no memory.
- `main.ts`: the live hero app.
