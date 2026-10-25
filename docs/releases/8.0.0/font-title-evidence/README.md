# Font title evidence

Production source: `cde56aa020652cb59fa578ecb5d28db84d620084`. These captures precede this evidence-only commit; they are not relabelled as later-head execution.

`scenes.json` contains 36 production app-view samples: interactive dark/light at 120×40, 64×20, 200×60 and 39×13, with model times 0, 350 and 1500 ms; static/pipe/accessible dark/light at 120×40 with model times 0 and 1500 ms. Lowered surface dimensions follow content. Theme selection uses the real settings keys before selecting the landing route. Model times are inputs; the renderer may quantize its paint time.

Four 120×40 samples retain glyph and foreground/background cell data: dark/light at 0 and 350 ms. The accompanying PNGs are macOS CoreText software previews using Menlo 15 at 9×18 pixels per cell. These are not physical terminal screenshots; text modifiers and terminal color downsampling are outside this evidence. Inspect the raw cell data when a local font renders differently.

Run the capture in a guarded Docker copy of the pinned source after `npm ci` and `npm run build`:

```sh
node --import tsx scripts/capture-font-title-evidence.ts > /data/scenes.json
```

Export the bounded JSON from the worker with `docker exec <worker> cat /data/scenes.json`, then run `python3 render.py` in this directory on macOS to regenerate the four PNGs. The renderer uses only system frameworks and the Python standard library. It does not execute application tests.

The capture asserts selected theme identity, current version and Enter prompt, no Braille in lower modes, and time-invariant lower-mode text. It does not replace navigation, resize, runtime animation or font API tests.

`narrow-red.log` records two expected assertion failures with 15 passing controls at production head `b915c24a92eed74654d42bc68aa6cc1f64e8438d`, adding only the regression tests (source tree `466d425428a3910a9487bc3b901f783042537d72`). `narrow-green.log` records all 50 tests in six font/raster suites passing after the fix, followed by test type checking and ESLint (source tree `8b508a0d350325ad2109de441864a4e1d3392b70`). The normal follow-up commit is `8a8d0e1a`; the subsequent capture harness commit changes no production rendering. The regression includes blank coverage and explicit threshold controls. Image sampling itself is unchanged; font Braille/quadrant defaults preserve nonzero coverage.

A separate live Google smoke at the capture source fetched a catalog of 1950 families, downloaded Lora (132188 bytes) and produced a 71×24 raster with 585 covered pixels. This is one network observation, not a fixed catalog size or proof for every font. Offline plain, explicit raster, and `NO_COLOR` raster CLI processes passed separately. The network and CLI output are not part of the scene snapshot.

Artifact hashes are in `SHA256SUMS`. They identify these retained bytes, not physical display fidelity or release readiness.
