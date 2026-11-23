# Web GPU showcase

This page is the reference for `examples/web-gpu`, a Vite page that mounts
Bijou example apps with `mountBijouCanvas()` on Geordi's presenters. To run
it, read the [showcase README](../../../examples/web-gpu/README.md). The
cases that hold this behavior are listed in the [test plan](./test-plan.md).

## What it mounts

| App | Source | How it loads |
| --- | --- | --- |
| `counter` | `examples/counter/main.ts`, unmodified | The build resolves `@flyingrobots/bijou-node` to `src/browser-start-app.ts`, whose `startApp(app)` hands the app to the page instead of starting a terminal run. |
| `showcase` | `examples/showcase/app.ts`, unmodified | `createShowcaseApp(ctx)`, built from the run's context. |

Each mount passes `mountBijouCanvas()` a factory that sets the run's context
as the default context, as `startApp()` does on Node, and then returns the
app. The two apps are made at different times:

- The counter's `App` is created when `load()` imports
  `examples/counter/main.ts`, once per page, before any mount. Module-level
  code there never sees a mount's context; the factory returns the existing
  `App`, whose `view()` reads the default context when it renders.
- The showcase's `App` is created inside the factory by
  `createShowcaseApp(ctx)`, once per mount, with that mount's context.

These example apps are not mounted, and the HUD lists them with their refusal:

| App | Refusal |
| --- | --- |
| `examples/components` | `BIJOU_WEB_GPU_NODE_IMPORT: node:fs imported by examples/components/library-font.ts`. It also reads files in `library-snippets.ts`, `examples/docs/app-cylinder-font.ts` and `examples/docs/i18n/dogfood-catalog.ts`. |
| `examples/hero` | `BIJOU_WEB_GPU_NODE_IMPORT: node:fs imported by examples/docs/app-cylinder-font.ts`, through `scenes.ts` and `examples/docs/app-cylinder-title.ts`. Its `perf.ts` also reads `process.memoryUsage()`. |

Both read files at module load, so they cannot be bundled for a browser
without changing them.

## Build

`vite.config.ts` bundles the Bijou packages from source, so each module, and
each module-level singleton such as the default context, has one copy. A
plugin refuses every Node.js built-in: an import of one fails the build with
`BIJOU_WEB_GPU_NODE_IMPORT: <module> imported by <file>`. No Node polyfill or
browser stub is bundled.

Geordi comes from two tarballs in `examples/web-gpu/vendor/`, packed at the
commit that `geordi-pin.json` records, and installed through `file:`
development dependencies whose `integrity` the lockfile records. The sealed
dependency worker receives those tarballs with the manifests, so the sealed
build is offline. The pin also records Geordi's procedural glyph table, which
the Canvas 2D presenter needs and the package does not ship, a workaround for
flyingrobots/geordi#205; the page refuses
to start Canvas 2D unless the table hashes to the package's own
`PROCEDURAL_GLYPH_TABLE_SHA256`.

## Presenters

All three presenters draw from one `GlyphAtlas`, built with Geordi's canvas
glyph rasterizer and its font and DPR watcher, in the font
`Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace` at 14 CSS pixels on
a 9 by 18 CSS-pixel cell. Glyph pixels depend on the host's fonts. Unset
colours are `#E6EDF3` and `#0D1117`.

| Backend | Factory | Receipt |
| --- | --- | --- |
| WebGPU | `createWebGPUSurfacePresenter(canvas, { atlas })` | The HUD reads `captureFrame()`, so the receipt is probed. |
| WebGL2 | `createWebGL2SurfacePresenter({ canvas, atlas, canonicalReadback: true })` | Every frame is read back, so the receipt is probed. |
| Canvas 2D | `createCanvas2DSurfacePresenter({ canvas, atlas, proceduralTable })` | Computed on the CPU and always `software-probed`. |

A mount's `cellPx` is fixed. When the watcher reports a new device pixel
ratio, the atlas has a new cell size and the page mounts the app again.

## HUD

| Row | Source |
| --- | --- |
| App, Backend, Fallback reasons | The mount handle: `backend` and `fallbackReasons`, each as `backend: code (reason)`. |
| Grid | `ctx.runtime.columns` by `ctx.runtime.rows`. |
| Cell, Device pixel ratio | The physical cell size and ratio the current mount was made with, so they always match its grid. |
| Frame time | Milliseconds the last `present()` call took, measured around the call, and the number of frames presented. |
| Evidence, Adapter, Atlas generation, Shader, Frame | The newest receipt: `evidenceLevel`, `adapter`, `atlasGeneration`, `shaderSha256` and `frameRgbaSha256`. |
| WebGL2 context | `lost` while the WebGL2 presenter reports a lost context. |
| Refusal or fault | `CODE: message` of a mount refusal or a fault that ended the run. |

`gpu-probed` means a named hardware adapter drew the frame and it was read
back; `software-probed` means a software rasterizer, or the Canvas 2D CPU path,
drew it. A receipt from `present()` without readback would be `unit-upload`;
the page always reads back, so the HUD never shows it.

## Controls

| Control | Effect |
| --- | --- |
| App buttons | Stop the mounted app and mount another. Operations run one at a time. |
| Backend buttons | `switchBackend()` to that backend on a fresh canvas. |
| Lose the WebGL2 context | `WEBGL_lose_context.loseContext()`, then `restoreContext()` once the presenter reports the loss. |
| Reset the glyph atlas | `atlas.invalidate(undefined, 'manual')`, a new atlas generation. |

`window.__bijouWebGpu` exposes the HUD state and these operations to the
browser suite, with `cellRect()`, which reads cells at the mount's cell size,
and `failures()`, every operation that failed, which a later mount does not
clear. A HUD refresh that fails is shown below the HUD. A WebGPU readback that
rejects because a switch disposed its presenter shows no receipt.

## DOM host check page

`examples/web-gpu/dom.html` is not part of the showcase. It mounts a small
semantic scene app (`src/dom/controls-app.ts`: a status, a Button, a text
input with a greeting that follows it, and a switch) with `mountBijouDom()`,
passing the real `document`. `window.__bijouDom` exposes the model, the
controller's diagnostics and `stop()` to the browser suite. The model counts
every action message it receives in `dispatches`.

## Evidence

The browser suite runs in Google Chrome, headless.

| Where | Chrome | WebGL2 | Canvas 2D | WebGPU |
| --- | --- | --- | --- | --- |
| Apple M5 Mac, locally | 158.0.8127.36 | ANGLE on Metal, `gpu-probed` | `software-probed` | Metal adapter, `gpu-probed` |
| Hosted Ubuntu runner, `browser_web_gpu` job | 157.0.8103.78 | ANGLE on SwiftShader, `software-probed` | `software-probed` | No adapter: the case is skipped as capability-refused |

For the counter, the WebGPU, WebGL2 and Canvas 2D frames have the same
`frameRgbaSha256`; the golden and WebGPU cases assert it.

Not verified: Firefox, Safari, a device pixel ratio other than 1, a DPR change
during a run, IME composition and paste in a real browser, and any timing
budget.
